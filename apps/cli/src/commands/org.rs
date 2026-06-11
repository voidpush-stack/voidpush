use anyhow::{Context as _, Result};
use clap::{Args as ClapArgs, Subcommand};
use colored::Colorize;

use crate::commands::Context;

#[derive(ClapArgs, Debug)]
pub struct Args {
    #[command(subcommand)]
    pub command: OrgCommand,
}

#[derive(Subcommand, Debug)]
pub enum OrgCommand {
    /// Create a new org anonymity pool
    Create(CreateArgs),
    /// List members of the current org pool
    Members(MembersArgs),
    /// Invite a team member to the org pool
    Invite(OrgInviteArgs),
    /// Show org-level aggregate scores
    Stats(StatsArgs),
    /// Configure CI/CD headless mode for this org
    Ci(CiArgs),
}

#[derive(ClapArgs, Debug)]
pub struct CreateArgs {
    /// Org name (private — not shown to reviewers)
    #[arg(value_name = "NAME")]
    pub name: String,
    /// Org region preference
    #[arg(long, value_parser = ["ap","eu","us","sa","auto"], default_value = "auto")]
    pub region: String,
}

#[derive(ClapArgs, Debug)]
pub struct MembersArgs {
    /// Show full void IDs
    #[arg(long)]
    pub verbose: bool,
}

#[derive(ClapArgs, Debug)]
pub struct OrgInviteArgs {
    /// Number of invite codes to generate
    #[arg(long, default_value = "1", value_parser = clap::value_parser!(u8).range(1..=10))]
    pub count: u8,
}

#[derive(ClapArgs, Debug)]
pub struct StatsArgs {
    /// Show per-member breakdown
    #[arg(long)]
    pub breakdown: bool,
    /// JSON output
    #[arg(long)]
    pub json: bool,
}

#[derive(ClapArgs, Debug)]
pub struct CiArgs {
    /// Generate a CI token for headless pushes
    #[arg(long)]
    pub generate_token: bool,
    /// Show current CI config
    #[arg(long)]
    pub show: bool,
}

pub async fn run(args: Args, ctx: Context) -> Result<()> {
    match args.command {
        OrgCommand::Create(a) => run_create(a, ctx).await,
        OrgCommand::Members(a) => run_members(a, ctx).await,
        OrgCommand::Invite(a) => run_invite(a, ctx).await,
        OrgCommand::Stats(a) => run_stats(a, ctx).await,
        OrgCommand::Ci(a) => run_ci(a, ctx).await,
    }
}

async fn run_create(args: CreateArgs, ctx: Context) -> Result<()> {
    println!("  Creating org anonymity pool: {}...", args.name.cyan());

    if ctx.dry_run {
        println!("  {} dry-run — skipping creation", "→".dimmed());
        return Ok(());
    }

    // TODO: POST to /api/org/create
    println!("{} Org pool created", "✓".green());
    println!();
    println!("  Name   : {}", args.name.cyan());
    println!("  Region : {}", args.region);
    println!("  Pool ID: {}", "org_a4f8c2e1".cyan());
    println!();
    println!("  Invite members with: {}", "void org invite".yellow());
    println!(
        "  Set up CI with:      {}",
        "void org ci --generate-token".yellow()
    );
    Ok(())
}

async fn run_members(_args: MembersArgs, _ctx: Context) -> Result<()> {
    // TODO: fetch from org API
    println!("{} Org members (anonymous IDs only)", "✓".green());
    println!();
    let members = [
        ("void_7f3a2b9c", 9.4, 47),
        ("void_b91d3c4e", 9.1, 31),
        ("void_3c7e1a2f", 8.8, 22),
        ("void_a40f5b6c", 8.5, 18),
    ];
    println!(
        "  {:<20} {:>8}  {:>10}",
        "Void ID".dimmed(),
        "Score".dimmed(),
        "Commits".dimmed()
    );
    for (id, score, commits) in members {
        println!("  {:<20} {:>8.1}  {:>10}", id.cyan(), score, commits);
    }
    println!();
    println!(
        "  {} members · org avg score: {}",
        members.len(),
        "8.95".cyan()
    );
    Ok(())
}

async fn run_invite(args: OrgInviteArgs, _ctx: Context) -> Result<()> {
    println!(
        "  Generating {} org invite{}...",
        args.count,
        if args.count > 1 { "s" } else { "" }
    );
    println!();
    for i in 0..args.count {
        let code = format!("ORG-VOID-{:08X}", rand::random::<u32>());
        println!("{} Invite {}/{}", "✓".green(), i + 1, args.count);
        println!("  {}", code.cyan());
        println!("  https://voidpush.dev/org/join?code={}", code);
        println!();
    }
    println!(
        "  {} Org invites grant access to the shared review pool.",
        "ℹ ".cyan()
    );
    Ok(())
}

async fn run_stats(args: StatsArgs, _ctx: Context) -> Result<()> {
    // TODO: fetch from org API
    let stats = serde_json::json!({
        "org_id":        "org_a4f8c2e1",
        "members":       4,
        "avg_score":     8.95,
        "total_commits": 118,
        "total_prs":     31,
        "top_void_id":   "void_7f3a2b9c",
        "period":        "this week",
    });

    if args.json {
        println!("{}", serde_json::to_string_pretty(&stats)?);
        return Ok(());
    }

    println!("{} Org stats — this week", "✓".green());
    println!();
    println!("  Members      : {}", stats["members"]);
    println!("  Avg score    : {}", stats["avg_score"].to_string().cyan());
    println!("  Total commits: {}", stats["total_commits"]);
    println!("  Total PRs    : {}", stats["total_prs"]);
    println!(
        "  Top contributor: {} (anonymous)",
        stats["top_void_id"].as_str().unwrap_or("").cyan()
    );
    Ok(())
}

async fn run_ci(args: CiArgs, _ctx: Context) -> Result<()> {
    if args.generate_token {
        let token = format!("vp_ci_{}", hex::encode(rand::random::<[u8; 16]>()));
        println!("{} CI token generated", "✓".green());
        println!();
        println!("  Token: {}", token.cyan());
        println!();
        println!("  Add to your CI environment:");
        println!("  {}", "VOIDPUSH_CI_TOKEN=<token>".yellow());
        println!();
        println!("  GitHub Actions example:");
        println!("  {}", "- run: void push origin main --ci".yellow());
        println!("  {}", "  env:".yellow());
        println!(
            "  {}",
            "    VOIDPUSH_CI_TOKEN: ${{ secrets.VOIDPUSH_CI_TOKEN }}".yellow()
        );
        return Ok(());
    }

    if args.show {
        println!("  CI mode: {}", "enabled".green());
        println!("  Token:   vp_ci_****...****");
        println!("  Region:  auto");
        return Ok(());
    }

    println!(
        "  Use {} to generate a CI token",
        "void org ci --generate-token".yellow()
    );
    println!(
        "  Use {} to view current config",
        "void org ci --show".yellow()
    );
    Ok(())
}
