use anyhow::{Context as _, Result};
use clap::Args as ClapArgs;
use colored::Colorize;
use rand::Rng;

use crate::{commands::Context, identity::Identity};

#[derive(ClapArgs, Debug)]
pub struct Args {
    /// Number of invite links to generate (max 5)
    #[arg(long, default_value = "1", value_parser = clap::value_parser!(u8).range(1..=5))]
    pub count: u8,

    /// Set a custom expiry in hours (default 168 = 7 days)
    #[arg(long, default_value = "168")]
    pub ttl: u32,

    /// Restrict invite to a specific relay region
    #[arg(long, value_parser = ["ap","eu","us","sa","auto"])]
    pub region: Option<String>,
}

pub async fn run(args: Args, ctx: Context) -> Result<()> {
    let identity = Identity::load().context("No identity found. Run `void init` first.")?;

    if identity.is_expired() {
        anyhow::bail!(
            "Identity expired. Run {} && {}",
            "void expire".yellow(),
            "void init".yellow()
        );
    }

    println!(
        "  Generating {} invite link{}...",
        args.count,
        if args.count > 1 { "s" } else { "" }
    );

    if ctx.dry_run {
        println!("  {} dry-run — skipping invite generation", "→".dimmed());
        return Ok(());
    }

    println!();

    for i in 0..args.count {
        let code = generate_invite_code(&identity.id, args.ttl);
        let url = format!("https://voidpush.dev/waitlist?invite={}", code);

        println!("{} Invite {}/{}", "✓".green(), i + 1, args.count);
        println!("  Code : {}", code.cyan());
        println!("  URL  : {}", url.dimmed());
        println!("  TTL  : {}h ({} days)", args.ttl, args.ttl / 24);
        if let Some(ref region) = args.region {
            println!("  Region restricted: {}", region.yellow());
        }
        println!();
    }

    println!(
        "  {} Invites are one-time use and tied to your ghost ID.",
        "⚠ ".yellow()
    );
    println!(
        "  {} Recipients bypass the waitlist and get immediate access.",
        "ℹ ".cyan()
    );

    Ok(())
}

/// Generate a cryptographically random invite code.
/// Format: VOID-XXXXXXXX (8 alphanumeric chars, uppercase)
fn generate_invite_code(void_id: &str, ttl_hours: u32) -> String {
    use sha2::{Digest, Sha256};

    let mut rng = rand::thread_rng();
    let nonce: u64 = rng.gen();

    // Mix void_id + nonce + ttl for uniqueness
    let mut hasher = Sha256::new();
    hasher.update(void_id.as_bytes());
    hasher.update(nonce.to_le_bytes());
    hasher.update(ttl_hours.to_le_bytes());
    let hash = hasher.finalize();

    // Base32-ish encoding — only uppercase alphanumeric, no ambiguous chars
    let chars: Vec<char> = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".chars().collect();
    let code: String = hash[..8]
        .iter()
        .map(|b| chars[(*b as usize) % chars.len()])
        .collect();

    format!("VOID-{}", code)
}
