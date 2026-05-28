use std::path::PathBuf;

pub mod clone;
pub mod expire;
pub mod init;
pub mod invite;
pub mod pr;
pub mod push;
pub mod relay;
pub mod score;
pub mod verify;

/// Shared context passed to every command from global CLI flags
#[derive(Debug, Clone)]
pub struct Context {
    pub verbose:     bool,
    pub dry_run:     bool,
    pub force_relay: Option<String>,
    pub no_zk:       bool,
    pub config_path: Option<PathBuf>,
}
