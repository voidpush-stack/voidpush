use anyhow::{Context as _, Result};
use clap::Args as ClapArgs;
use colored::Colorize;

use crate::{commands::Context, identity::Identity};

#[derive(ClapArgs, Debug)]
pub struct Args {
    /// Fetch score for a specific PR number
    #[arg(long, value_name = "PR_ID")]
    pub pr: Option<u64>,

    /// Show full score history for this ghost identity
    #[arg(long)]
    pub all: bool,

    /// Output as JSON
    #[arg(long)]
    pub json: bool,
}

pub async fn run(args: Args, ctx: Context) -> Result<()> {
    let identity = Identity::load().context("No identity found. Run `void init` first.")?;

    if args.pr.is_some() {
        println!("  Fetching score for PR #{}...", args.pr.unwrap());
    } else {
        println!("  Fetching score for {}...", identity.id.cyan());
    }

    // TODO: replace with real API call to score engine
    let score = mock_score(&identity.id, args.pr);

    if args.json {
        println!("{}", serde_json::to_string_pretty(&score)?);
        return Ok(());
    }

    println!("{} Score retrieved", "✓".green());
    println!();
    println!("  Last push  : void://org/repo · main");
    println!(
        "  Score      : {}",
        format!("{} / 10", score.score).cyan().bold()
    );
    println!(
        "  Rank       : {} this week · {} all time",
        format!("#{}", score.rank_weekly).yellow(),
        format!("#{}", score.rank_alltime).dimmed()
    );
    println!("  Reviewers  : {} (blind, anonymous)", score.reviewer_count);

    if let Some(feedback) = score.feedback.first() {
        println!("  Feedback   : \"{}\"", feedback.dimmed());
    }

    if ctx.verbose {
        println!();
        println!("  Breakdown:");
        println!("    readability : {}", score.breakdown.readability);
        println!("    correctness : {}", score.breakdown.correctness);
        println!("    style       : {}", score.breakdown.style);
    }

    println!();
    println!(
        "{} ZK proof updated · reputation linked across sessions",
        "✓".green()
    );

    Ok(())
}

// ─── Mock score (replace with real HTTP call to score engine) ─────────────────

#[derive(Debug, serde::Serialize)]
struct Score {
    void_id: String,
    score: f32,
    rank_weekly: u32,
    rank_alltime: u32,
    reviewer_count: u32,
    feedback: Vec<String>,
    breakdown: Breakdown,
    zk_updated: bool,
}

#[derive(Debug, serde::Serialize)]
struct Breakdown {
    readability: f32,
    correctness: f32,
    style: f32,
}

fn mock_score(void_id: &str, _pr: Option<u64>) -> Score {
    Score {
        void_id: void_id.to_string(),
        score: 9.4,
        rank_weekly: 3,
        rank_alltime: 12,
        reviewer_count: 4,
        feedback: vec!["Clean refactor, good test coverage".to_string()],
        breakdown: Breakdown {
            readability: 9.6,
            correctness: 9.2,
            style: 9.4,
        },
        zk_updated: true,
    }
}
