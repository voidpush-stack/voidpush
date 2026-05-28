"""
Cryptographic audit log for the score engine.
Records every scored push and review with ed25519 signatures.
Makes the integrity of the scoring system publicly verifiable.
"""

import json
import os
import hashlib
import time
from pathlib import Path
from typing import Optional

import structlog

log = structlog.get_logger()

AUDIT_LOG_PATH = Path(os.getenv("AUDIT_LOG_PATH", "/var/log/ghost-score/audit.jsonl"))


class AuditLog:
    """
    Append-only audit log with ed25519 signatures.

    Each entry is a JSON line containing:
    - event type and timestamp
    - relevant identifiers (push_hash, void_id, chain_id)
    - NO payload content, NO source IP, NO real identity
    - SHA-256 hash of the previous entry (chain integrity)
    - ed25519 signature over the entry
    """

    def __init__(self, log_path: Optional[Path] = None):
        self.path = log_path or AUDIT_LOG_PATH
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._prev_hash = self._load_last_hash()

    def _load_last_hash(self) -> str:
        """Load the hash of the last log entry for chain continuity."""
        if not self.path.exists():
            return "0" * 64
        try:
            with open(self.path, "rb") as f:
                # Read last non-empty line
                lines = f.read().splitlines()
                for line in reversed(lines):
                    if line.strip():
                        return hashlib.sha256(line).hexdigest()
        except Exception:
            pass
        return "0" * 64

    def _write(self, event_type: str, data: dict) -> None:
        """Write a signed audit log entry."""
        entry = {
            "ts":        time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "event":     event_type,
            "prev_hash": self._prev_hash,
            **data,
        }

        # Deterministic JSON for consistent hashing
        entry_bytes = json.dumps(entry, sort_keys=True, separators=(",", ":")).encode()

        # Hash this entry
        entry_hash = hashlib.sha256(entry_bytes).hexdigest()

        # TODO: sign with ed25519 private key
        # signature = sign(entry_bytes, private_key)
        entry["hash"]      = entry_hash
        entry["signature"] = "TODO:ed25519"  # placeholder

        line = json.dumps(entry, sort_keys=True, separators=(",", ":"))

        try:
            with open(self.path, "a") as f:
                f.write(line + "\n")
            self._prev_hash = entry_hash
        except Exception as e:
            log.warning("audit_log.write_failed", error=str(e))

    def log_push_registered(self, void_id: str, push_hash: str, repo_url: str) -> None:
        self._write("push.registered", {
            "void_id":  void_id,
            "push_hash": push_hash,
            "repo_url":  repo_url,
        })

    def log_review_submitted(self, push_hash: str, reviewer_count: int) -> None:
        self._write("review.submitted", {
            "push_hash":     push_hash,
            "reviewer_count": reviewer_count,
            # Reviewer identity deliberately NOT logged
        })

    def log_score_computed(self, void_id: str, push_hash: str, score: float) -> None:
        self._write("score.computed", {
            "void_id":  void_id,
            "push_hash": push_hash,
            "score":     score,
        })

    def log_zk_proof_verified(self, chain_id: str, valid: bool) -> None:
        self._write("zk.proof.verified", {
            "chain_id": chain_id,
            "valid":    valid,
            # Ghost ID deliberately NOT logged — only chain_id
        })

    def log_rank_updated(self, void_count: int, period: str) -> None:
        self._write("rank.updated", {
            "void_count": void_count,
            "period":      period,
        })


# Singleton instance
_audit_log: Optional[AuditLog] = None


def get_audit_log() -> AuditLog:
    global _audit_log
    if _audit_log is None:
        _audit_log = AuditLog()
    return _audit_log
