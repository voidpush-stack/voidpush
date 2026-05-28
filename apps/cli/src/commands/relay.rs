use anyhow::Result;
use clap::{Args, Subcommand};
use colored::Colorize;

use crate::commands::Context;

#[derive(Args, Debug)]
pub struct Args {
    #[command(subcommand)]
    pub command: RelayCommand,
}

#[derive(Subcommand, Debug)]
pub enum RelayCommand {
    /// List available relay nodes
    Ls(LsArgs),
    /// Ping a specific relay node
    Ping(PingArgs),
}

#[derive(Args, Debug)]
pub struct LsArgs {
    /// Show full relay metadata
    #[arg(long, short = 'v')]
    pub verbose: bool,

    /// Filter by region
    #[arg(long, value_parser = ["ap","eu","us","sa","af"])]
    pub region: Option<String>,

    /// Sort by field
    #[arg(long, default_value = "latency", value_parser = ["latency","trust","uptime"])]
    pub sort: String,
}

#[derive(Args, Debug)]
pub struct PingArgs {
    /// Relay ID to ping (e.g. R1)
    pub relay_id: String,
}

pub async fn run(args: Args, ctx: Context) -> Result<()> {
    match args.command {
        RelayCommand::Ls(ls_args)   => run_ls(ls_args, ctx).await,
        RelayCommand::Ping(p_args)  => run_ping(p_args, ctx).await,
    }
}

async fn run_ls(args: LsArgs, ctx: Context) -> Result<()> {
    // TODO: replace with real relay registry API call
    let mut relays = mock_relays();

    if let Some(region) = &args.region {
        relays.retain(|r| &r.region == region);
    }

    match args.sort.as_str() {
        "trust"  => relays.sort_by(|a, b| b.trust.partial_cmp(&a.trust).unwrap()),
        "uptime" => relays.sort_by(|a, b| b.uptime.partial_cmp(&a.uptime).unwrap()),
        _        => relays.sort_by_key(|r| r.latency_ms),
    }

    let online = relays.iter().filter(|r| r.online).count();
    println!("{} {} relays online ({} degraded)", "✓".green(), online, relays.len() - online);
    println!();

    for relay in &relays {
        let status = if relay.online { "●".green() } else { "○".dimmed() };
        let latency_color = if relay.latency_ms < 30 {
            relay.latency_ms.to_string().green()
        } else if relay.latency_ms < 80 {
            relay.latency_ms.to_string().yellow()
        } else {
            relay.latency_ms.to_string().normal()
        };

        if args.verbose || ctx.verbose {
            println!(
                "  {}  {:<12} {}  · {}ms  · trust {}  · uptime {}%  · {}",
                relay.id.cyan(),
                relay.city,
                relay.country,
                latency_color,
                relay.trust,
                relay.uptime,
                relay.relay_type.dimmed(),
            );
        } else {
            println!(
                "  {}  {:<12} {}  · {}ms  · trust {}",
                relay.id.cyan(),
                relay.city,
                relay.country,
                latency_color,
                relay.trust,
            );
        }

        if !relay.online {
            println!("      {} offline", status);
        }
    }

    Ok(())
}

async fn run_ping(args: PingArgs, _ctx: Context) -> Result<()> {
    println!("  Pinging {}...", args.relay_id.cyan());
    // TODO: real ping
    println!("{} {} responded in 18ms", "✓".green(), args.relay_id.cyan());
    Ok(())
}

// ─── Mock relay data (replace with registry API) ──────────────────────────────

struct RelayInfo {
    id: String,
    city: String,
    country: String,
    region: String,
    latency_ms: u32,
    trust: f32,
    uptime: f32,
    relay_type: String,
    online: bool,
}

fn mock_relays() -> Vec<RelayInfo> {
    vec![
        RelayInfo { id: "R1".into(), city: "Tokyo".into(),     country: "JP".into(), region: "ap".into(), latency_ms: 12,  trust: 9.8, uptime: 99.97, relay_type: "core".into(),      online: true  },
        RelayInfo { id: "R2".into(), city: "São Paulo".into(), country: "BR".into(), region: "sa".into(), latency_ms: 88,  trust: 9.6, uptime: 99.81, relay_type: "community".into(), online: true  },
        RelayInfo { id: "R3".into(), city: "Frankfurt".into(), country: "DE".into(), region: "eu".into(), latency_ms: 22,  trust: 9.9, uptime: 99.99, relay_type: "core".into(),      online: true  },
        RelayInfo { id: "R4".into(), city: "Singapore".into(), country: "SG".into(), region: "ap".into(), latency_ms: 18,  trust: 9.7, uptime: 99.94, relay_type: "core".into(),      online: true  },
        RelayInfo { id: "R5".into(), city: "Amsterdam".into(), country: "NL".into(), region: "eu".into(), latency_ms: 19,  trust: 9.8, uptime: 99.98, relay_type: "core".into(),      online: true  },
        RelayInfo { id: "R6".into(), city: "Mumbai".into(),    country: "IN".into(), region: "ap".into(), latency_ms: 44,  trust: 9.5, uptime: 99.76, relay_type: "community".into(), online: true  },
        RelayInfo { id: "R7".into(), city: "Chicago".into(),   country: "US".into(), region: "us".into(), latency_ms: 31,  trust: 9.6, uptime: 99.91, relay_type: "core".into(),      online: true  },
        RelayInfo { id: "R8".into(), city: "Sydney".into(),    country: "AU".into(), region: "ap".into(), latency_ms: 71,  trust: 9.4, uptime: 99.83, relay_type: "community".into(), online: true  },
        RelayInfo { id: "R9".into(), city: "Lagos".into(),     country: "NG".into(), region: "af".into(), latency_ms: 102, trust: 9.2, uptime: 99.55, relay_type: "community".into(), online: false },
    ]
}
