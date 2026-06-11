use anyhow::{bail, Context as _, Result};
use clap::Args as ClapArgs;
use colored::Colorize;
use std::process::Command;

use crate::{commands::Context, identity::Identity, relay_client::RelayClient, stripper::Stripper};

#[derive(ClapArgs, Debug)]
pub struct Args {
    /// Remote name
    #[arg(default_value = "origin")]
    pub remote: String,

    /// Branch to push
    #[arg(default_value = "main")]
    pub branch: String,

    /// Number of relay hops (min 3, max 9; set VPUSH_ALLOW_SINGLE_HOP=1 for local tests)
    #[arg(long, default_value = "3", value_parser = parse_hops)]
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
    let repo = git2::Repository::open_from_env().context("Not inside a git repository")?;

    // Count unpushed commits
    let unpushed = count_unpushed_commits(&repo, &args.remote, &args.branch)?;
    println!("  Scanning {} commits for metadata...", unpushed);

    // Strip metadata
    let stripper = Stripper::new(&identity, !args.preserve_timestamps);

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
    println!("  Building relay chain (min {} hops)...", args.hops);

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
        println!(
            "{} Would push {} commits via {} hops",
            "✓".green(),
            stripped_count,
            args.hops
        );
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

    let git_data = create_git_bundle(&repo, &args.branch)
        .with_context(|| format!("Failed to create git bundle for branch '{}'", args.branch))?;

    relay_client
        .transmit(&chain, &remote_url, &args.branch, git_data, args.force)
        .await
        .context("Failed to transmit through relay chain")?;

    println!("{} Encrypted · transmitting...", "✓".green());
    println!(
        "{} Pushed anonymously to {}",
        "✓".green(),
        format!("void://{}", remote_url).cyan()
    );
    println!();
    println!(
        "  Quality score: {} (24h review window)",
        "pending".dimmed()
    );
    println!("  Run {} to check after review", "void score".yellow());

    Ok(())
}

fn count_unpushed_commits(repo: &git2::Repository, remote: &str, branch: &str) -> Result<usize> {
    let local_ref = format!("refs/heads/{}", branch);
    let remote_ref = format!("refs/remotes/{}/{}", remote, branch);

    let local_oid = repo
        .refname_to_id(&local_ref)
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

fn parse_hops(value: &str) -> std::result::Result<u8, String> {
    let hops = value
        .parse::<u8>()
        .map_err(|_| "hops must be an integer".to_string())?;

    if (3..=9).contains(&hops)
        || (hops == 1 && std::env::var("VPUSH_ALLOW_SINGLE_HOP").ok().as_deref() == Some("1"))
    {
        Ok(hops)
    } else {
        Err("hops must be between 3 and 9".to_string())
    }
}

fn create_git_bundle(repo: &git2::Repository, branch: &str) -> Result<Vec<u8>> {
    let workdir = repo
        .workdir()
        .or_else(|| repo.path().parent())
        .context("Unable to determine repository directory")?;
    let branch_ref = format!("refs/heads/{}", branch);

    repo.refname_to_id(&branch_ref)
        .with_context(|| format!("Branch '{}' not found", branch))?;

    let bundle = tempfile::NamedTempFile::new().context("Failed to create temporary bundle")?;
    let output = Command::new("git")
        .arg("-C")
        .arg(workdir)
        .arg("bundle")
        .arg("create")
        .arg(bundle.path())
        .arg(&branch_ref)
        .env("GIT_TERMINAL_PROMPT", "0")
        .output()
        .context("Failed to execute git bundle")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("git bundle failed: {}", stderr.trim());
    }

    std::fs::read(bundle.path()).context("Failed to read git bundle")
}
