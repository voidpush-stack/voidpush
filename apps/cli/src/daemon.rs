use anyhow::Result;
use chrono::Utc;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{info, warn};

use crate::identity::Identity;

/// Run the auto-expire daemon.
/// Checks every 60 seconds if the current identity has passed its TTL.
/// If so, performs a secure wipe and exits cleanly.
pub async fn run_daemon() -> Result<()> {
    info!("ghost auto-expire daemon started");

    loop {
        sleep(Duration::from_secs(60)).await;

        let identity = match Identity::load() {
            Ok(id) => id,
            Err(_) => {
                // No identity — nothing to watch
                continue;
            }
        };

        // Skip if auto-expire is disabled
        if !identity.auto_expire {
            continue;
        }

        let now = Utc::now();
        let ttl_remaining = identity.expires_at - now;

        if ttl_remaining.num_seconds() <= 0 {
            warn!(
                void_id = %identity.id,
                "Identity TTL expired — performing secure wipe"
            );

            match identity.secure_wipe(false) {
                Ok(_) => {
                    info!("Identity wiped successfully — ghost is anonymous");
                    // Exit — user must run void init to get a new identity
                    std::process::exit(0);
                }
                Err(e) => {
                    warn!("Failed to wipe identity: {} — will retry", e);
                }
            }
        } else if ttl_remaining.num_hours() <= 1 {
            // Warn when < 1h remaining
            warn!(
                void_id = %identity.id,
                ttl_mins = ttl_remaining.num_minutes(),
                "Identity expiring soon"
            );
        }
    }
}

/// Spawn the daemon as a background tokio task.
/// Call this from main after identity is loaded.
pub fn spawn_daemon() {
    tokio::spawn(async move {
        if let Err(e) = run_daemon().await {
            warn!("Auto-expire daemon error: {}", e);
        }
    });
}

/// Check TTL and print a warning if expiring soon — call at start of each command.
pub fn check_ttl_warn() {
    if let Ok(identity) = Identity::load() {
        if !identity.auto_expire {
            return;
        }
        let ttl = identity.expires_at - Utc::now();
        if ttl.num_seconds() <= 0 {
            eprintln!(
                "\x1b[33m⚠  Identity {} has expired. Run void expire && void init.\x1b[0m",
                identity.id
            );
        } else if ttl.num_hours() < 1 {
            eprintln!(
                "\x1b[33m⚠  Identity {} expires in {}m.\x1b[0m",
                identity.id,
                ttl.num_minutes()
            );
        }
    }
}
