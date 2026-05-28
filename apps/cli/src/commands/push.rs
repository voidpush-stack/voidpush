use anyhow::{bail, Context as _, Result};
use clap::Args;
use colored::Colorize;

use crate::{commands::Context, identity::Identity, relay_client::RelayClient, stripper::Stripper};

#[derive(Args, Debug)]
pub struct Args {
    /// Remote name
    #[arg(default_value = "origin")]
    pub remote: String,

    /// Branch to push
    #[arg(default_value = "main")]
    pub branch: String,

    /// Number of relay hops (min 3, max 9)
    #[arg(long, default_value = "3", value_parser = clap::value_parser!(u8).range(3..=9))]
    pub hops: u8,

    /// Keep commit timestamps (weakens anonymity)
    #[arg(long)]
    pub preserve_timestamps: bool,

    /// Force push (equivalent to git push --force)
    #[arg(long, short = 'f')]
    pub force: bool,

    /// Add anonymous tag to this push
    #[arg(long, value_name = "TAG")]
    pub tag: Option<String>,
}

pub async fn run(args: Args, ctx: Context) -> Result<()> {
    // Load identity
    let identity = Identity::load().context("No identity found. Run `void init` first.")?;

    if identity.is_expired() {
        bail!(
            "Identity expired. Run {} && {}",
            "void expire".yellow(),
            "void init".yellow()
        );
    }

    // Open git repo
    let repo = git2::Repository::open_from_env()
        .context("Not inside a git repository")?;

    // Count unpushed commits
    let unpushed = count_unpushed_commits(&repo, &args.remote, &args.branch)?;
    println!("  Scanning {} commits for metadata...", unpushed);

    // Strip metadata
    let stripper = Stripper::new(
        &identity,
        !args.preserve_timestamps,
    );

    let stripped_count = if ctx.dry_run {
        println!("  {} dry-run — skipping metadata strip", "→".dimmed());
        unpushed
    } else {
        stripper
            .strip_commits(&repo)
            .context("Failed to strip commit metadata")?
    };

    println!(
        "  Stripping: {}",
        "author, email, timestamp, paths, hostname".dimmed()
    );
    println!(
        "{} Metadata stripped from {} commits",
        "✓".green(),
        stripped_count
    );

    // Build relay chain
    println!(
        "  Building relay chain (min {} hops)...",
        args.hops
    );

    let relay_client = RelayClient::new(ctx.force_relay.as_deref());
    let chain = relay_client
        .build_chain(args.hops as usize)
        .await
        .context("Failed to build relay chain — are relays reachable?")?;

    let chain_str = chain
        .hops
        .iter()
        .map(|h| h.city.as_str())
        .collect::<Vec<_>>()
        .join(" → ");

    if ctx.verbose {
        println!("  Chain: {}", chain_str.cyan());
        println!("  Estimated latency: {}ms", chain.total_latency_ms);
    } else {
        println!("  Chain: {}", chain_str.cyan());
    }

    if ctx.dry_run {
        println!("  {} dry-run — skipping actual push", "→".dimmed());
        println!("{} Would push {} commits via {} hops", "✓".green(), stripped_count, args.hops);
        return Ok(());
    }

    // Encrypt and transmit
    println!("  Encrypting payload with relay pubkeys...");

    let remote_url = repo
        .find_remote(&args.remote)
        .with_context(|| format!("Remote '{}' not found", args.remote))?
        .url()
        .unwrap_or("unknown")
        .to_string();

    relay_client
        .transmit(&chain, &remote_url, &args.branch, args.force)
        .await
        .context("Failed to transmit through relay chain")?;

    println!("{} Encrypted · transmitting...", "✓".green());
    println!("{} Pushed anonymously to {}", "✓".green(), format!("void://{}", remote_url).cyan());
    println!();
    println!("  Quality score: {} (24h review window)", "pending".dimmed());
    println!("  Run {} to check after review", "void score".yellow());

    Ok(())
}

fn count_unpushed_commits(
    repo: &git2::Repository,
    remote: &str,
    branch: &str,
) -> Result<usize> {
    let local_ref = format!("refs/heads/{}", branch);
    let remote_ref = format!("refs/remotes/{}/{}", remote, branch);

    let local_oid = repo.refname_to_id(&local_ref)
        .with_context(|| format!("Branch '{}' not found", branch))?;

    let remote_oid = repo.refname_to_id(&remote_ref).ok();

    match remote_oid {
        None => {
            // No remote tracking branch — count all commits
            let mut revwalk = repo.revwalk()?;
            revwalk.push(local_oid)?;
            Ok(revwalk.count())
        }
        Some(remote_oid) => {
            let mut revwalk = repo.revwalk()?;
            revwalk.push(local_oid)?;
            revwalk.hide(remote_oid)?;
            Ok(revwalk.count())
        }
    }
}
