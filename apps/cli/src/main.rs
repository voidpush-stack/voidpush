use anyhow::Result;
use clap::{Parser, Subcommand};
use tracing_subscriber::{fmt, EnvFilter};

mod commands;
mod daemon;
mod identity;
mod relay_client;
mod stripper;

use commands::{clone, expire, init, invite, pr, push, relay, score, verify};

#[derive(Parser)]
#[command(
    name = "vpush",
    version = "0.1.0",
    about = "Anonymous git wrapper — VoidPush",
    long_about = "ghost is a thin wrapper around git that strips identity metadata\nfrom every operation and routes traffic through an anonymous relay chain.\n\nYour code speaks. Your identity doesn't.",
    after_help = "Run 'ghost <command> --help' for command-specific flags.\nDocs: https://voidpush.dev/docs"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    #[arg(long, global = true)]
    verbose: bool,

    #[arg(long, global = true)]
    dry_run: bool,

    #[arg(long, global = true, value_name = "RELAY_ID")]
    relay: Option<String>,

    #[arg(long, global = true)]
    no_zk: bool,

    #[arg(long, global = true, value_name = "PATH")]
    config: Option<std::path::PathBuf>,
}

#[derive(Subcommand)]
enum Commands {
    /// Generate a new ephemeral identity
    Init(init::Args),
    /// Push commits anonymously through relay chain
    Push(push::Args),
    /// Clone a repository anonymously via void://
    Clone(clone::Args),
    /// Open an anonymous pull request
    Pr(pr::Args),
    /// Fetch quality score for last push or a specific PR
    Score(score::Args),
    /// Relay node management
    Relay(relay::Args),
    /// Immediately destroy current identity (3-pass wipe)
    Expire(expire::Args),
    /// Generate one-time-use invite links for other ghosts
    Invite(invite::Args),
    /// Generate ZK proof of past contributions
    Verify(verify::Args),
}

#[tokio::main]
async fn main() -> Result<()> {
    fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .with_target(false)
        .with_level(false)
        .without_time()
        .init();

    let cli = Cli::parse();

    let ctx = commands::Context {
        verbose:     cli.verbose,
        dry_run:     cli.dry_run,
        force_relay: cli.relay,
        no_zk:       cli.no_zk,
        config_path: cli.config,
    };

    // TTL warning on every command except init/expire
    match &cli.command {
        Commands::Init(_) | Commands::Expire(_) => {}
        _ => daemon::check_ttl_warn(),
    }

    // Spawn auto-expire background daemon
    match &cli.command {
        Commands::Init(_) | Commands::Expire(_) => {}
        _ => daemon::spawn_daemon(),
    }

    match cli.command {
        Commands::Init(args)   => init::run(args, ctx).await,
        Commands::Push(args)   => push::run(args, ctx).await,
        Commands::Clone(args)  => clone::run(args, ctx).await,
        Commands::Pr(args)     => pr::run(args, ctx).await,
        Commands::Score(args)  => score::run(args, ctx).await,
        Commands::Relay(args)  => relay::run(args, ctx).await,
        Commands::Expire(args) => expire::run(args, ctx).await,
        Commands::Invite(args) => invite::run(args, ctx).await,
        Commands::Verify(args) => verify::run(args, ctx).await,
    }
}
