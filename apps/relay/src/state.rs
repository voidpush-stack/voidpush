use anyhow::Result;
use std::sync::Arc;
use x25519_dalek::StaticSecret;

use crate::{config::Config, forwarder::Forwarder};

pub struct AppState {
    pub relay_id: String,
    pub region: String,
    pub private_key: StaticSecret,
    pub forwarder: Forwarder,
    pub max_payload_bytes: usize,
    pub start_time: std::time::Instant,
}

impl AppState {
    pub async fn new(cfg: &Config) -> Result<Self> {
        // Decode private key from hex
        let key_bytes = hex::decode(&cfg.private_key_hex)
            .map_err(|_| anyhow::anyhow!("Invalid RELAY_PRIVATE_KEY hex"))?;

        let key_arr: [u8; 32] = key_bytes
            .try_into()
            .map_err(|_| anyhow::anyhow!("RELAY_PRIVATE_KEY must be 32 bytes (64 hex chars)"))?;

        let private_key = StaticSecret::from(key_arr);

        Ok(AppState {
            relay_id: cfg.relay_id.clone(),
            region: cfg.region.clone(),
            private_key,
            forwarder: Forwarder::new(),
            max_payload_bytes: cfg.max_payload_bytes,
            start_time: std::time::Instant::now(),
        })
    }
}
