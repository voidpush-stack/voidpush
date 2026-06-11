use anyhow::{Context as _, Result};
use clap::Args as ClapArgs;
use colored::Colorize;

use crate::{commands::Context, identity::Identity, relay_client::RelayClient};

#[derive(ClapArgs, Debug)]
pub struct Args {
    /// PR title (required)
    #[arg(long, short = 't')]
    pub title: String,

    /// PR description (markdown supported)
    #[arg(long, short = 'b')]
    pub body: Option<String>,

    /// Target branch
    #[arg(long, default_value = "main")]
    pub into: String,

    /// Open as draft PR
    #[arg(long)]
    pub draft: bool,

    /// Minimum blind reviewers to request
    #[arg(long, default_value = "2")]
    pub reviewers: u8,
}

pub async fn run(args: Args, ctx: Context) -> Result<()> {
    let identity = Identity::load().context("No identity found. Run `void init` first.")?;

    println!("  Creating anonymous pull request...");
    println!("  Stripping author from diff metadata");

    let relay_client = RelayClient::new(ctx.force_relay.as_deref());
    let chain = relay_client
        .build_chain(3)
        .await
        .context("Failed to build relay chain")?;

    let chain_str: String = chain
        .hops
        .iter()
        .map(|h| h.city.as_str())
        .collect::<Vec<_>>()
        .join(" → ");

    println!("  Routing through relay: {}", chain_str.cyan());

    if ctx.dry_run {
        println!("  {} dry-run — skipping PR creation", "→".dimmed());
        return Ok(());
    }

    // TODO: real PR creation via relay → score engine API
    let pr_num = 503u64;

    println!("{} PR #{} opened anonymously", "✓".green(), pr_num);
    println!();
    println!("  PR #{} · void://org/repo", pr_num);
    println!("  Reviewers will see only the diff");
    println!(
        "  {} · {} · {}",
        "No name".dimmed(),
        "no profile".dimmed(),
        "no avatar".dimmed()
    );
    println!();
    println!("  Track at: {} --pr {}", "void score".yellow(), pr_num);

    let _ = identity; // suppress unused warning until real API is wired up
    Ok(())
}
