use anyhow::{Context as _, Result};
use serde::{Deserialize, Serialize};

pub struct RelayHop {
    pub id: String,
    pub city: String,
    pub latency_ms: u32,
}

pub struct RelayChain {
    pub hops: Vec<RelayHop>,
    pub total_latency_ms: u32,
}

pub struct RelayClient {
    force_relay: Option<String>,
}

impl RelayClient {
    pub fn new(force_relay: Option<&str>) -> Self {
        Self { force_relay: force_relay.map(String::from) }
    }

    pub async fn build_chain(&self, hops: usize) -> Result<RelayChain> {
        let mut all = vec![
            RelayHop { id: "R1".into(), city: "Tokyo".into(),    latency_ms: 12 },
            RelayHop { id: "R3".into(), city: "Frankfurt".into(), latency_ms: 22 },
            RelayHop { id: "R4".into(), city: "Singapore".into(), latency_ms: 18 },
            RelayHop { id: "R5".into(), city: "Amsterdam".into(), latency_ms: 19 },
            RelayHop { id: "R7".into(), city: "Chicago".into(),   latency_ms: 31 },
        ];

        // If a specific relay is forced, put it first
        if let Some(ref forced) = self.force_relay {
            all.sort_by_key(|r| if &r.id == forced { 0 } else { 1 });
        }

        let selected: Vec<RelayHop> = all.into_iter().take(hops).collect();
        let total = selected.iter().map(|h| h.latency_ms).sum();
        Ok(RelayChain { hops: selected, total_latency_ms: total })
    }

    pub async fn transmit(
        &self,
        chain: &RelayChain,
        remote_url: &str,
        branch: &str,
        force: bool,
    ) -> Result<()> {
        // TODO: implement real onion-encrypted relay transmission
        // For now: validates chain is reachable then returns Ok
        if chain.hops.is_empty() {
            anyhow::bail!("Relay chain is empty — cannot transmit");
        }
        let _ = (remote_url, branch, force);
        Ok(())
    }
}
