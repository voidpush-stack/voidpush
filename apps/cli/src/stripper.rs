use anyhow::Result;
use git2::{Repository, Signature};

use crate::identity::Identity;

pub struct Stripper<'a> {
    identity: &'a Identity,
    strip_timestamps: bool,
}

impl<'a> Stripper<'a> {
    pub fn new(identity: &'a Identity, strip_timestamps: bool) -> Self {
        Self {
            identity,
            strip_timestamps,
        }
    }

    /// Strip all author/committer metadata from unpushed commits.
    pub fn strip_commits(&self, repo: &Repository) -> Result<usize> {
        let mut count = 0;

        let mut revwalk = repo.revwalk()?;
        revwalk.push_head()?;

        let anon_name = self.identity.id.clone();
        let anon_email = "anon@voidpush.null".to_string();

        let oids: Vec<git2::Oid> = revwalk.filter_map(|r| r.ok()).take(100).collect();

        for oid in &oids {
            let commit = repo.find_commit(*oid)?;

            // Skip already-anonymized commits
            if commit.author().email() == Some("anon@voidpush.null") {
                continue;
            }

            let sig = if self.strip_timestamps {
                Signature::now(&anon_name, &anon_email)?
            } else {
                Signature::new(&anon_name, &anon_email, &commit.author().when())?
            };

            let parents: Vec<git2::Commit> = commit.parents().collect();
            let parent_refs: Vec<&git2::Commit> = parents.iter().collect();

            repo.commit(
                None,
                &sig,
                &sig,
                commit.message().unwrap_or(""),
                &commit.tree()?,
                &parent_refs,
            )?;

            count += 1;
        }

        Ok(count)
    }
}
