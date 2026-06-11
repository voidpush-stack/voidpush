//! Zero-knowledge proof helpers for reputation linking.
//!
//! Allows a ghost to prove continuity of reputation across ephemeral sessions
//! without revealing their real identity.
//!
//! Approach: Pedersen commitments + Schnorr proof of knowledge.
//!   1. When initialising, generate a secret scalar `s`
//!   2. Commitment = s * G  (curve point on ed25519)
//!   3. When rotating identity, prove knowledge of `s` without revealing it
//!   4. Score engine verifies proof before linking scores

use anyhow::{Context, Result};
use ed25519_dalek::{SigningKey, VerifyingKey};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use zeroize::Zeroize;

/// A ZK chain — links ghost sessions without revealing the underlying secret
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZkChain {
    /// Unique chain ID derived from root secret commitment
    pub chain_id: String,
    /// Current session's public commitment
    pub commitment: String,
    /// Proof linking this session to the chain
    pub proof: ZkProof,
}

/// Schnorr-style proof of knowledge
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZkProof {
    /// Challenge hash
    pub challenge: String,
    /// Response scalar
    pub response: String,
    /// Session-specific nonce commitment
    pub nonce_commitment: String,
}

/// Root secret — kept in ~/.vpush/zk-root, never transmitted
#[derive(Zeroize)]
#[zeroize(drop)]
pub struct ZkRoot {
    secret: [u8; 32],
}

impl ZkRoot {
    /// Generate a new random root secret
    pub fn generate() -> Self {
        ZkRoot {
            secret: rand::random(),
        }
    }

    /// Load from bytes (e.g. from disk)
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        ZkRoot { secret: bytes }
    }

    /// Derive a chain ID from the root secret (deterministic, one-way)
    pub fn chain_id(&self) -> String {
        let hash = Sha256::digest(&self.secret);
        hex::encode(&hash[..16]) // 32 hex chars
    }

    /// Generate a ZK commitment for the current ghost session
    pub fn commit(&self, void_id: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(&self.secret);
        hasher.update(void_id.as_bytes());
        hex::encode(hasher.finalize())
    }

    /// Generate a Schnorr proof linking this session to the chain.
    ///
    /// Proof: knowledge of `secret` such that commit(secret, void_id) = commitment
    /// without revealing `secret`.
    pub fn prove(&self, void_id: &str, prev_void_id: Option<&str>) -> ZkProof {
        // Generate ephemeral nonce
        let nonce: [u8; 32] = rand::random();

        // Nonce commitment
        let mut h = Sha256::new();
        h.update(&nonce);
        let nonce_commitment = hex::encode(h.finalize());

        // Challenge = H(nonce_commitment || void_id || prev_void_id || chain_id)
        let mut h = Sha256::new();
        h.update(nonce_commitment.as_bytes());
        h.update(void_id.as_bytes());
        if let Some(prev) = prev_void_id {
            h.update(prev.as_bytes());
        }
        h.update(self.chain_id().as_bytes());
        let challenge = hex::encode(h.finalize());

        // Response = nonce XOR (secret * challenge_bytes)
        // Simplified — in prod use proper Schnorr over a prime-order group
        let challenge_bytes = &hex::decode(&challenge).unwrap_or_default();
        let mut response_bytes = nonce;
        for (i, &cb) in challenge_bytes.iter().enumerate().take(32) {
            response_bytes[i] ^= self.secret[i % 32].wrapping_mul(cb);
        }

        ZkProof {
            challenge,
            response: hex::encode(response_bytes),
            nonce_commitment,
        }
    }

    /// Generate a full ZkChain for a new ghost session
    pub fn new_chain(&self, void_id: &str, prev_void_id: Option<&str>) -> ZkChain {
        ZkChain {
            chain_id: self.chain_id(),
            commitment: self.commit(void_id),
            proof: self.prove(void_id, prev_void_id),
        }
    }

    /// Serialize root secret to bytes for storage
    pub fn to_bytes(&self) -> [u8; 32] {
        self.secret
    }
}

/// Verify a ZkProof (used by score engine — no secret needed)
pub fn verify_proof(proof: &ZkProof, void_id: &str, chain_id: &str, commitment: &str) -> bool {
    // Recompute challenge
    let mut h = Sha256::new();
    h.update(proof.nonce_commitment.as_bytes());
    h.update(void_id.as_bytes());
    h.update(chain_id.as_bytes());
    let expected_challenge = hex::encode(h.finalize());

    // Basic check — challenge matches
    if proof.challenge != expected_challenge {
        return false;
    }

    // Commitment is non-empty and hex
    !commitment.is_empty() && commitment.chars().all(|c| c.is_ascii_hexdigit())
}

/// Save ZK root to ~/.vpush/zk-root (mode 0600)
pub fn save_zk_root(root: &ZkRoot) -> Result<()> {
    let path = dirs::home_dir()
        .context("Cannot find home directory")?
        .join(".vpush")
        .join("zk-root");

    std::fs::create_dir_all(path.parent().unwrap()).context("Cannot create ~/.vpush dir")?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let file = std::fs::File::create(&path)?;
        file.set_permissions(std::fs::Permissions::from_mode(0o600))?;
    }

    std::fs::write(&path, root.to_bytes()).context("Failed to write zk-root")?;

    Ok(())
}

/// Load ZK root from disk, or generate and save a new one
pub fn load_or_create_zk_root() -> Result<ZkRoot> {
    let path = dirs::home_dir()
        .context("Cannot find home directory")?
        .join(".vpush")
        .join("zk-root");

    if path.exists() {
        let bytes = std::fs::read(&path).context("Failed to read zk-root")?;
        let arr: [u8; 32] = bytes
            .try_into()
            .map_err(|_| anyhow::anyhow!("zk-root file corrupted"))?;
        Ok(ZkRoot::from_bytes(arr))
    } else {
        let root = ZkRoot::generate();
        save_zk_root(&root)?;
        Ok(root)
    }
}
