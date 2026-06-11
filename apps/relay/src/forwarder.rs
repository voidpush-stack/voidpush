use anyhow::{Context, Result};
use reqwest::Client;
use std::time::Duration;
use tracing::{info, warn};

use crate::onion::OnionPacket;

pub struct Forwarder {
    client: Client,
}

impl Forwarder {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .tcp_keepalive(Duration::from_secs(10))
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("Failed to build HTTP client");
        Self { client }
    }

    pub async fn forward_to_relay(&self, next_hop_url: &str, packet: &OnionPacket) -> Result<()> {
        info!("Forwarding to next relay: {}", next_hop_url);

        let payload = serde_json::to_vec(packet).context("Failed to serialize onion packet")?;

        let resp = self
            .client
            .post(format!(
                "{}/relay/forward",
                next_hop_url.trim_end_matches('/')
            ))
            .header("Content-Type", "application/json")
            .header("X-VoidPush-Relay", "1")
            .body(payload)
            .send()
            .await
            .with_context(|| format!("Failed to connect to relay: {}", next_hop_url))?;

        if !resp.status().is_success() {
            anyhow::bail!("Relay {} returned error: {}", next_hop_url, resp.status());
        }

        info!("Successfully forwarded to {}", next_hop_url);
        Ok(())
    }

    pub async fn push_to_git_remote(
        &self,
        remote_url: &str,
        branch: &str,
        git_payload: &[u8],
        force: bool,
    ) -> Result<()> {
        info!("Exit relay: pushing to {}", remote_url);

        if git_payload.is_empty() {
            anyhow::bail!("git payload is empty");
        }

        let branch_ref = format!("refs/heads/{}", branch);
        let bundle = tempfile::NamedTempFile::new().context("Failed to create temp bundle")?;
        std::fs::write(bundle.path(), git_payload).context("Failed to write git bundle")?;

        let repo_dir = tempfile::tempdir().context("Failed to create temp git repo")?;
        run_git(
            repo_dir.path(),
            &["init"],
            "Failed to initialize temp git repo",
        )?;
        let bundle_path = bundle.path().to_string_lossy().to_string();
        let fetch_refspec = format!("{}:{}", branch_ref, branch_ref);
        run_git(
            repo_dir.path(),
            &["fetch", &bundle_path, &fetch_refspec],
            "Failed to fetch git bundle",
        )?;

        let refspec = format!("{}:{}", branch_ref, branch_ref);
        let mut cmd_args = vec!["push", remote_url, &refspec];
        if force {
            cmd_args.push("--force");
        }

        run_git(repo_dir.path(), &cmd_args, "git push failed")?;

        info!("Successfully pushed to {}", remote_url);
        Ok(())
    }

    pub async fn forward_with_retry(&self, next_hop_url: &str, packet: &OnionPacket) -> Result<()> {
        let mut attempts = 0u64;
        loop {
            attempts += 1;
            match self.forward_to_relay(next_hop_url, packet).await {
                Ok(_) => return Ok(()),
                Err(e) if attempts < 3 => {
                    warn!("Forward attempt {} failed: {}. Retrying...", attempts, e);
                    tokio::time::sleep(Duration::from_millis(500 * attempts)).await;
                }
                Err(e) => return Err(e),
            }
        }
    }
}

impl Default for Forwarder {
    fn default() -> Self {
        Self::new()
    }
}

fn run_git(cwd: &std::path::Path, args: &[&str], error_context: &str) -> Result<()> {
    let output = std::process::Command::new("git")
        .current_dir(cwd)
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_AUTHOR_NAME", "vpush")
        .env("GIT_AUTHOR_EMAIL", "anon@voidpush.null")
        .env("GIT_COMMITTER_NAME", "vpush")
        .env("GIT_COMMITTER_EMAIL", "anon@voidpush.null")
        .output()
        .with_context(|| format!("{}: failed to execute git", error_context))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("{}: {}", error_context, stderr.trim());
    }

    Ok(())
}
