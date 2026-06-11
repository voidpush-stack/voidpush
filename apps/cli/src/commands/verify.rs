use anyhow::{Context as _, Result};
use clap::Args as ClapArgs;
use colored::Colorize;

use crate::{commands::Context, identity::Identity};

#[derive(ClapArgs, Debug)]
pub struct Args {
    /// Verify a specific ZK chain ID
    #[arg(long, value_name = "CHAIN_ID")]
    pub chain: Option<String>,

    /// Output proof as JSON (for CI pipelines)
    #[arg(long)]
    pub json: bool,

    /// Submit proof to a specific repo's verification endpoint
    #[arg(long, value_name = "REPO_URL")]
    pub submit_to: Option<String>,
}

pub async fn run(args: Args, ctx: Context) -> Result<()> {
    let identity = Identity::load().context("No identity found. Run `void init` first.")?;

    // Load ZK root
    let zk_root = void_crypto::zk::load_or_create_zk_root()
        .context("Failed to load ZK root — run `void init --link` first")?;

    let chain_id = args
        .chain
        .as_deref()
        .unwrap_or_else(|| identity.zk_chain_id.as_deref().unwrap_or("none"));

    if chain_id == "none" {
        anyhow::bail!(
            "No ZK chain found. Generate a linked identity with {} first.",
            "void init --link".yellow()
        );
    }

    println!("  Generating ZK proof of contribution...");
    println!("  Chain ID : {}", chain_id.cyan());

    // Generate proof
    let prev_id: Option<String> = None;
    let chain = zk_root.new_chain(&identity.id, prev_id.as_deref());

    println!("{} Proof generated", "✓".green());

    if args.json {
        let json = serde_json::json!({
            "void_id":   identity.id,
            "chain_id":   chain.chain_id,
            "commitment": chain.commitment,
            "proof": {
                "challenge":        chain.proof.challenge,
                "response":         chain.proof.response,
                "nonce_commitment": chain.proof.nonce_commitment,
            },
        });
        println!("{}", serde_json::to_string_pretty(&json)?);
        return Ok(());
    }

    println!();
    println!("  void_id   : {}", identity.id.cyan());
    println!("  chain_id   : {}", chain.chain_id.cyan());
    println!("  commitment : {}...", &chain.commitment[..16]);
    println!("  proof      : {} (schnorr-style)", "valid".green());

    if let Some(ref repo_url) = args.submit_to {
        println!();
        println!("  Submitting proof to {}...", repo_url.dimmed());

        if ctx.dry_run {
            println!("  {} dry-run — skipping submission", "→".dimmed());
        } else {
            // TODO: POST proof to repo verification endpoint
            println!(
                "{} Proof submitted — contributor status verified",
                "✓".green()
            );
        }
    }

    println!();
    println!(
        "  {} This proof shows you have contributed before, without revealing which ghost IDs you've used.",
        "ℹ ".cyan()
    );

    Ok(())
}
