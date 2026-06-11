use anyhow::{Context as _, Result};
use clap::Args as ClapArgs;
use colored::Colorize;

use crate::{commands::Context, identity::Identity};

#[derive(ClapArgs, Debug)]
pub struct Args {
    #[arg(long, default_value = "72", value_name = "HOURS")]
    pub ttl: u32,
    #[arg(long)]
    pub persist: bool,
    #[arg(long)]
    pub link: bool,
    #[arg(long, value_name = "REGION", value_parser = ["ap","eu","us","sa","auto"])]
    pub relay_region: Option<String>,
}

pub async fn run(args: Args, ctx: Context) -> Result<()> {
    if Identity::exists()? {
        eprintln!(
            "{} Identity already exists. Run {} first.",
            "error:".red().bold(),
            "void expire".yellow()
        );
        std::process::exit(1);
    }

    println!("  Generating Ed25519 keypair locally...");

    if ctx.dry_run {
        println!("  {} dry-run — skipping keypair write", "→".dimmed());
        return Ok(());
    }

    let region = args.relay_region.as_deref().unwrap_or("auto");
    let identity = Identity::generate(args.ttl, args.persist, region, args.link, None)
        .context("Failed to generate identity")?;

    println!(
        "{} Keypair generated (stored: ~/.vpush/identity)",
        "✓".green()
    );
    println!("  Setting TTL: {} hours", args.ttl);
    println!("{} Identity: {}", "✓".green(), identity.id.cyan());

    if args.link {
        println!("{} ZK reputation chain linked", "✓".green());
    }

    println!("  Configuring relay preferences...");
    println!("{} Ready — you are now a ghost", "✓".green());
    println!();

    if !args.persist {
        println!(
            "{} Identity auto-expires in {}h. Use {} to extend.",
            "⚠ ".yellow(),
            args.ttl,
            "--persist".yellow()
        );
    }

    if ctx.verbose {
        println!();
        println!("  void_id    : {}", identity.id);
        println!("  public_key  : {}", &identity.verifying_key_hex[..16]);
        println!("  ttl         : {}h", args.ttl);
        println!("  region      : {}", region);
        println!("  zk_linked   : {}", args.link);
        if let Some(ref chain_id) = identity.zk_chain_id {
            println!("  zk_chain_id : {}", chain_id);
        }
    }

    Ok(())
}
