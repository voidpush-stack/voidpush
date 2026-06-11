use anyhow::{Context, Result};

#[derive(Debug, Clone)]
pub struct Config {
    pub relay_id: String,
    pub region: String,
    pub port: u16,
    /// This relay's X25519 private key (hex encoded) — loaded from env
    pub private_key_hex: String,
    /// Registry URL to register with on startup
    pub registry_url: String,
    /// Max payload size in bytes (default 50MB)
    pub max_payload_bytes: usize,
    /// Whether this is a core or community node
    pub node_type: NodeType,
}

#[derive(Debug, Clone, PartialEq)]
pub enum NodeType {
    Core,
    Community,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Config {
            relay_id: std::env::var("RELAY_ID").unwrap_or_else(|_| "R0".to_string()),
            region: std::env::var("RELAY_REGION").unwrap_or_else(|_| "eu".to_string()),
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()
                .context("Invalid PORT")?,
            private_key_hex: std::env::var("RELAY_PRIVATE_KEY")
                .context("RELAY_PRIVATE_KEY is required")?,
            registry_url: std::env::var("REGISTRY_URL")
                .unwrap_or_else(|_| "https://registry.voidpush.dev".to_string()),
            max_payload_bytes: std::env::var("MAX_PAYLOAD_BYTES")
                .unwrap_or_else(|_| "52428800".to_string())
                .parse()
                .unwrap_or(52_428_800),
            node_type: match std::env::var("NODE_TYPE").as_deref() {
                Ok("community") => NodeType::Community,
                _ => NodeType::Core,
            },
        })
    }
}
