use anyhow::{Context as _, Result};
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Nonce,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use x25519_dalek::{EphemeralSecret, PublicKey};

#[derive(Clone)]
pub struct RelayHop {
    pub id: String,
    pub city: String,
    pub latency_ms: u32,
    pub url: Option<String>,
    pub public_key: Option<[u8; 32]>,
}

pub struct RelayChain {
    pub hops: Vec<RelayHop>,
    pub total_latency_ms: u32,
}

pub struct RelayClient {
    force_relay: Option<String>,
    http: Client,
}

impl RelayClient {
    pub fn new(force_relay: Option<&str>) -> Self {
        let http = Client::builder()
            .timeout(Duration::from_secs(30))
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("failed to build relay HTTP client");

        Self {
            force_relay: force_relay.map(String::from),
            http,
        }
    }

    pub async fn build_chain(&self, hops: usize) -> Result<RelayChain> {
        let mut all = self.load_relays().await?;

        if let Some(ref forced) = self.force_relay {
            all.sort_by_key(|r| if &r.id == forced { 0 } else { 1 });
        }

        let selected: Vec<RelayHop> = all.into_iter().take(hops).collect();
        let total = selected.iter().map(|h| h.latency_ms).sum();
        Ok(RelayChain {
            hops: selected,
            total_latency_ms: total,
        })
    }

    pub async fn transmit(
        &self,
        chain: &RelayChain,
        remote_url: &str,
        branch: &str,
        git_data: Vec<u8>,
        force: bool,
    ) -> Result<()> {
        if chain.hops.is_empty() {
            anyhow::bail!("Relay chain is empty - cannot transmit");
        }

        let packet = build_onion_packet(chain, remote_url, branch, git_data, force)?;
        let entry = chain.hops.first().expect("checked above");
        let entry_url = entry
            .url
            .as_deref()
            .with_context(|| format!("Relay {} is missing url metadata", entry.id))?;

        let resp = self
            .http
            .post(format!("{}/relay/forward", entry_url.trim_end_matches('/')))
            .header("Content-Type", "application/json")
            .header("X-VoidPush-Relay", "1")
            .json(&packet)
            .send()
            .await
            .with_context(|| format!("Failed to connect to entry relay {}", entry.id))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            anyhow::bail!("Entry relay {} returned {}: {}", entry.id, status, body);
        }

        Ok(())
    }

    async fn load_relays(&self) -> Result<Vec<RelayHop>> {
        if let Ok(raw) = std::env::var("VPUSH_RELAYS_JSON") {
            return parse_registry_relays(&raw);
        }

        if let Ok(url) = std::env::var("VPUSH_RELAY_REGISTRY") {
            let text = self
                .http
                .get(format!("{}/relays", url.trim_end_matches('/')))
                .send()
                .await
                .with_context(|| format!("Failed to fetch relay registry at {}", url))?
                .error_for_status()
                .context("Relay registry returned an error")?
                .text()
                .await
                .context("Failed to read relay registry response")?;

            return parse_registry_relays(&text);
        }

        Ok(mock_relays())
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct OnionPacket {
    ephemeral_pubkey: [u8; 32],
    nonce: [u8; 12],
    ciphertext: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
struct InnerLayer {
    next_hop: Option<String>,
    payload: Vec<u8>,
}

#[derive(Debug, Serialize)]
struct GitPayload<'a> {
    remote_url: &'a str,
    branch: &'a str,
    git_data: Vec<u8>,
    force: bool,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum RegistryResponse {
    List(Vec<RegistryRelay>),
    Wrapped { relays: Vec<RegistryRelay> },
}

#[derive(Debug, Deserialize)]
struct RegistryRelay {
    id: String,
    city: Option<String>,
    url: Option<String>,
    public_key: Option<String>,
    public_key_hex: Option<String>,
    x25519_public_key: Option<String>,
    latency_ms: Option<u32>,
    trust: Option<f32>,
    online: Option<bool>,
}

fn build_onion_packet(
    chain: &RelayChain,
    remote_url: &str,
    branch: &str,
    git_data: Vec<u8>,
    force: bool,
) -> Result<OnionPacket> {
    let git_payload = GitPayload {
        remote_url,
        branch,
        git_data,
        force,
    };

    let mut payload =
        serde_json::to_vec(&git_payload).context("Failed to serialize git payload")?;

    for (idx, hop) in chain.hops.iter().enumerate().rev() {
        let next_hop = if idx + 1 < chain.hops.len() {
            Some(chain.hops[idx + 1].url.clone().with_context(|| {
                format!("Relay {} is missing url metadata", chain.hops[idx + 1].id)
            })?)
        } else {
            None
        };

        let inner = InnerLayer { next_hop, payload };
        let public_key = PublicKey::from(
            hop.public_key
                .with_context(|| format!("Relay {} is missing public key metadata", hop.id))?,
        );
        let packet = wrap_layer(&inner, &public_key)?;
        payload = serde_json::to_vec(&packet).context("Failed to serialize onion packet")?;
    }

    serde_json::from_slice(&payload).context("Failed to build entry onion packet")
}

fn wrap_layer(inner: &InnerLayer, recipient_pubkey: &PublicKey) -> Result<OnionPacket> {
    let plaintext = serde_json::to_vec(inner).context("Failed to serialize inner layer")?;

    let ephemeral_secret = EphemeralSecret::random_from_rng(rand::rngs::OsRng);
    let ephemeral_pubkey = PublicKey::from(&ephemeral_secret);
    let shared_secret = ephemeral_secret.diffie_hellman(recipient_pubkey);

    let cipher = ChaCha20Poly1305::new_from_slice(shared_secret.as_bytes())
        .context("Failed to initialize onion cipher")?;

    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_slice())
        .map_err(|_| anyhow::anyhow!("Failed to encrypt onion layer"))?;

    Ok(OnionPacket {
        ephemeral_pubkey: ephemeral_pubkey.to_bytes(),
        nonce: nonce_bytes,
        ciphertext,
    })
}

fn parse_registry_relays(raw: &str) -> Result<Vec<RelayHop>> {
    let response: RegistryResponse =
        serde_json::from_str(raw).context("Relay registry response is not valid JSON")?;

    let relays = match response {
        RegistryResponse::List(relays) => relays,
        RegistryResponse::Wrapped { relays } => relays,
    };

    let mut parsed = Vec::new();
    for relay in relays {
        if relay.online == Some(false) || relay.trust.is_some_and(|trust| trust < 7.0) {
            continue;
        }

        let public_key = relay
            .public_key
            .or(relay.public_key_hex)
            .or(relay.x25519_public_key)
            .map(|key| parse_public_key(&key))
            .transpose()?;

        parsed.push(RelayHop {
            id: relay.id,
            city: relay.city.unwrap_or_else(|| "unknown".to_string()),
            latency_ms: relay.latency_ms.unwrap_or(999),
            url: relay.url,
            public_key,
        });
    }

    parsed.sort_by_key(|r| r.latency_ms);
    Ok(parsed)
}

fn parse_public_key(value: &str) -> Result<[u8; 32]> {
    let trimmed = value.strip_prefix("0x").unwrap_or(value);
    let bytes = hex::decode(trimmed).context("Relay public key must be 32 bytes encoded as hex")?;

    bytes
        .try_into()
        .map_err(|_| anyhow::anyhow!("Relay public key must be exactly 32 bytes"))
}

fn mock_relays() -> Vec<RelayHop> {
    vec![
        RelayHop {
            id: "R1".into(),
            city: "Tokyo".into(),
            latency_ms: 12,
            url: None,
            public_key: None,
        },
        RelayHop {
            id: "R3".into(),
            city: "Frankfurt".into(),
            latency_ms: 22,
            url: None,
            public_key: None,
        },
        RelayHop {
            id: "R4".into(),
            city: "Singapore".into(),
            latency_ms: 18,
            url: None,
            public_key: None,
        },
        RelayHop {
            id: "R5".into(),
            city: "Amsterdam".into(),
            latency_ms: 19,
            url: None,
            public_key: None,
        },
        RelayHop {
            id: "R7".into(),
            city: "Chicago".into(),
            latency_ms: 31,
            url: None,
            public_key: None,
        },
    ]
}
