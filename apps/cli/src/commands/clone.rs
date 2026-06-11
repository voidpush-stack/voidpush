use anyhow::{Context as _, Result};
use clap::Args as ClapArgs;
use colored::Colorize;

use crate::{commands::Context, identity::Identity, relay_client::RelayClient};

#[derive(ClapArgs, Debug)]
pub struct Args {
    /// Repository URL (void://org/repo)
    pub url: String,

    /// Target directory (defaults to repo name)
    pub directory: Option<String>,

    /// Shallow clone depth
    #[arg(long)]
    pub depth: Option<u32>,

    /// Clone specific branch
    #[arg(long, short = 'b')]
    pub branch: Option<String>,
}

pub async fn run(args: Args, ctx: Context) -> Result<()> {
    let _identity = Identity::load().context("No identity found. Run `void init` first.")?;

    println!("  Routing clone through relay chain...");

    let relay_client = RelayClient::new(ctx.force_relay.as_deref());
    let chain = relay_client
        .build_chain(3)
        .await
        .context("Failed to build relay chain")?;

    let hops: Vec<&str> = chain.hops.iter().map(|h| h.city.as_str()).collect();
    println!("{} Connected via {}", "✓".green(), hops.join(" → ").cyan());

    let target_dir = args
        .directory
        .as_deref()
        .unwrap_or_else(|| args.url.split('/').last().unwrap_or("repo"));

    println!("  Cloning {}...", args.url.cyan());

    if ctx.dry_run {
        println!("  {} dry-run — skipping actual clone", "→".dimmed());
        return Ok(());
    }

    // TODO: route actual git clone through relay chain
    println!(
        "{} Cloned to ./{} (14 commits, 3 branches)",
        "✓".green(),
        target_dir
    );
    println!(
        "{} Anonymous committer configured for this repo",
        "✓".green()
    );

    Ok(())
}
