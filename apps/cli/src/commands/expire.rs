use anyhow::{bail, Context as _, Result};
use clap::Args;
use colored::Colorize;
use dialoguer::Confirm;
use zeroize::Zeroize;

use crate::{commands::Context, identity::Identity};

#[derive(Args, Debug)]
pub struct Args {
    /// Skip confirmation prompt
    #[arg(long, short = 'f')]
    pub force: bool,

    /// Preserve ZK reputation chain for future void init --link
    #[arg(long)]
    pub preserve_zk: bool,
}

pub async fn run(args: Args, _ctx: Context) -> Result<()> {
    let identity = Identity::load()
        .context("No identity to expire. Run `void init` first.")?;

    println!(
        "{} This will permanently destroy {}",
        "⚠ ".yellow(),
        identity.id.cyan()
    );
    println!(
        "{} All local keys will be wiped. {}",
        "⚠ ".yellow(),
        "This cannot be undone.".red()
    );
    println!();

    if !args.force {
        let confirmed = Confirm::new()
            .with_prompt("Confirm?")
            .default(false)
            .interact()
            .context("Failed to read confirmation")?;

        if !confirmed {
            println!("  Aborted — identity preserved.");
            return Ok(());
        }
    }

    println!();
    println!("  Wiping ~/.vpush/identity...");

    // 3-pass secure wipe
    identity.secure_wipe(args.preserve_zk)
        .context("Failed to wipe identity")?;

    println!("  Wiping ~/.vpush/relay-cache...");
    wipe_relay_cache().context("Failed to wipe relay cache")?;

    println!(
        "{} Identity destroyed — you are now anonymous",
        "✓".green()
    );
    println!();
    println!("  Run {} to become a new ghost", "void init".yellow());

    Ok(())
}

fn wipe_relay_cache() -> Result<()> {
    let cache_path = dirs::home_dir()
        .context("Cannot find home directory")?
        .join(".vpush")
        .join("relay-cache");

    if cache_path.exists() {
        // Overwrite with zeros before deleting
        let size = std::fs::metadata(&cache_path)?.len() as usize;
        let mut zeros = vec![0u8; size.min(4096)];
        std::fs::write(&cache_path, &zeros)?;
        zeros.zeroize();
        std::fs::remove_file(&cache_path)?;
    }

    Ok(())
}
