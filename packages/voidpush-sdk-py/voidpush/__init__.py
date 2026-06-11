"""
VoidPush Python SDK
Anonymous code contribution — push to the void, judged on merit alone.

Usage:
    from voidpush import VoidPushClient

    client = VoidPushClient()

    # Register a push for blind review
    await client.register_push(
        void_id="void_7f3a2b9c",
        push_hash="abc123",
        repo_url="void://org/repo",
        branch="main",
    )

    # Get score (available 24h after push)
    score = await client.get_score("void_7f3a2b9c")
    print(score.score)  # 9.4
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import httpx

__version__ = "1.0.0"
__all__ = [
    "VoidPushClient",
    "VoidScore",
    "ScoreBreakdown",
    "LeaderboardEntry",
    "NetworkStats",
    "VoidPushError",
    "RateLimitError",
    "ScoreNotReadyError",
]

# ─── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class ScoreBreakdown:
    readability: float
    correctness: float
    style:       float


@dataclass
class VoidScore:
    void_id:        str
    push_hash:      str
    repo_url:       str
    score:          float
    breakdown:      ScoreBreakdown
    reviewer_count: int
    feedback:       list[str]
    rank_weekly:    Optional[int]
    rank_alltime:   Optional[int]
    zk_updated:     bool
    scored_at:      str


@dataclass
class LeaderboardEntry:
    void_id:       str
    rank:          int
    avg_score:     float
    total_commits: int
    total_prs:     int
    streak_days:   int
    region:        Optional[str] = None


@dataclass
class NetworkStats:
    active_contributors: int
    total_anon_commits:  int
    anonymity_rate_pct:  float
    active_relays:       int


# ─── Errors ───────────────────────────────────────────────────────────────────

class VoidPushError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None, detail: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.detail      = detail


class RateLimitError(VoidPushError):
    def __init__(self, retry_after_secs: int = 60):
        super().__init__(f"Rate limited. Retry after {retry_after_secs}s", 429)
        self.retry_after_secs = retry_after_secs


class ScoreNotReadyError(VoidPushError):
    def __init__(self):
        super().__init__("Score not yet available. Wait up to 24h after push.", 404)


# ─── Client ───────────────────────────────────────────────────────────────────

class VoidPushClient:
    """
    Async VoidPush API client.

    All methods are async — use with `await` in an async context,
    or use `asyncio.run()` for scripts.
    """

    def __init__(
        self,
        api_url:    str = "https://api.voidpush.dev",
        timeout_s:  float = 10.0,
        api_key:    Optional[str] = None,
    ) -> None:
        self._base  = api_url.rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=self._base,
            timeout=timeout_s,
            headers={
                "User-Agent": f"voidpush-python/{__version__}",
                **({"Authorization": f"Bearer {api_key}"} if api_key else {}),
            },
        )

    async def __aenter__(self) -> "VoidPushClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    # ─── Push ─────────────────────────────────────────────────────────────────

    async def register_push(
        self,
        void_id:    str,
        push_hash:  str,
        repo_url:   str,
        branch:     str,
        pr_id:      Optional[int] = None,
        zk_proof:   Optional[str] = None,
        zk_chain_id: Optional[str] = None,
    ) -> dict:
        """Register an anonymous push for blind review."""
        return await self._post("/v1/push", {
            "void_id":     void_id,
            "push_hash":   push_hash,
            "repo_url":    repo_url,
            "branch":      branch,
            "pr_id":       pr_id,
            "zk_proof":    zk_proof,
            "zk_chain_id": zk_chain_id,
        })

    # ─── Review ───────────────────────────────────────────────────────────────

    async def submit_review(
        self,
        push_hash:   str,
        readability: float,
        correctness: float,
        style:       float,
        feedback:    Optional[str] = None,
    ) -> dict:
        """Submit a blind code review. No authentication required."""
        return await self._post("/v1/review", {
            "push_hash":   push_hash,
            "readability": readability,
            "correctness": correctness,
            "style":       style,
            "feedback":    feedback,
        })

    # ─── Scores ───────────────────────────────────────────────────────────────

    async def get_score(self, void_id: str, pr_id: Optional[int] = None) -> VoidScore:
        """
        Get the latest quality score for a void identity.
        Raises ScoreNotReadyError if score not yet available (wait 24h).
        """
        params = f"?pr={pr_id}" if pr_id else ""
        data = await self._get(f"/v1/score/{void_id}{params}")
        return self._parse_score(data)

    async def get_score_history(self, void_id: str, limit: int = 10) -> list[VoidScore]:
        """Get full score history for a void identity."""
        data = await self._get(f"/v1/score/{void_id}/history?limit={limit}")
        return [self._parse_score(s) for s in data.get("history", [])]

    # ─── Leaderboard ──────────────────────────────────────────────────────────

    async def get_leaderboard(
        self,
        period: str = "week",
        limit:  int = 20,
        region: Optional[str] = None,
    ) -> list[LeaderboardEntry]:
        """Get the anonymous leaderboard."""
        params = f"period={period}&limit={limit}"
        if region:
            params += f"&region={region}"
        data = await self._get(f"/v1/leaderboard?{params}")
        return [
            LeaderboardEntry(
                void_id=e["void_id"],
                rank=e["rank"],
                avg_score=e["avg_score"],
                total_commits=e["total_commits"],
                total_prs=e["total_prs"],
                streak_days=e["streak_days"],
                region=e.get("region"),
            )
            for e in data.get("ghosts", [])
        ]

    async def get_stats(self) -> NetworkStats:
        """Get global network stats."""
        data = await self._get("/v1/stats")
        return NetworkStats(
            active_contributors=data.get("active_contributors", data.get("active_ghosts", 0)),
            total_anon_commits=data.get("total_anon_commits", 0),
            anonymity_rate_pct=data.get("anonymity_rate_pct", 0.0),
            active_relays=data.get("active_relays", 0),
        )

    async def verify_proof(
        self,
        void_id:    str,
        chain_id:   str,
        commitment: str,
        proof:      dict,
    ) -> bool:
        """Verify a ZK proof of contribution. Returns True if valid."""
        data = await self._post("/v1/verify-proof", {
            "void_id":    void_id,
            "chain_id":   chain_id,
            "commitment": commitment,
            "proof":      proof,
        })
        return bool(data.get("valid", False))

    # ─── Internal ─────────────────────────────────────────────────────────────

    async def _get(self, path: str) -> dict:
        try:
            res = await self._client.get(path)
            return self._handle(res)
        except httpx.TimeoutException as e:
            raise VoidPushError(f"Request timed out: {e}") from e

    async def _post(self, path: str, body: dict) -> dict:
        try:
            res = await self._client.post(path, json={k: v for k, v in body.items() if v is not None})
            return self._handle(res)
        except httpx.TimeoutException as e:
            raise VoidPushError(f"Request timed out: {e}") from e

    def _handle(self, res: httpx.Response) -> dict:
        if res.status_code == 429:
            retry = int(res.headers.get("Retry-After", "60"))
            raise RateLimitError(retry)
        if res.status_code == 404 and "score" in str(res.url):
            raise ScoreNotReadyError()
        if not res.is_success:
            data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
            raise VoidPushError(
                f"API error {res.status_code}",
                status_code=res.status_code,
                detail=data.get("detail") or data.get("error"),
            )
        return res.json()

    @staticmethod
    def _parse_score(data: dict) -> VoidScore:
        bd = data.get("breakdown", {})
        return VoidScore(
            void_id=data["void_id"],
            push_hash=data["push_hash"],
            repo_url=data["repo_url"],
            score=data["score"],
            breakdown=ScoreBreakdown(
                readability=bd.get("readability", 0.0),
                correctness=bd.get("correctness", 0.0),
                style=bd.get("style", 0.0),
            ),
            reviewer_count=data["reviewer_count"],
            feedback=data.get("feedback", []),
            rank_weekly=data.get("rank_weekly"),
            rank_alltime=data.get("rank_alltime"),
            zk_updated=data.get("zk_updated", False),
            scored_at=data.get("scored_at", ""),
        )
