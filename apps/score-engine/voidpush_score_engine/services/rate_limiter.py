"""
Rate limiting for the score engine.
Prevents ghost ID recycling and review spam.

Uses Redis for distributed rate limiting across multiple score engine instances.
Falls back to in-memory if Redis is unavailable.
"""

import asyncio
import os
import time
from collections import defaultdict
from typing import Optional

import structlog

log = structlog.get_logger()

# ─── Limits ──────────────────────────────────────────────────────────────────

LIMITS = {
    # Max pushes a single ghost ID can register per hour
    "push_register": {"max": 10, "window_secs": 3600},
    # Max reviews a single token can submit per hour
    "review_submit": {"max": 20, "window_secs": 3600},
    # Max score fetches per ghost ID per minute
    "score_fetch":   {"max": 60, "window_secs": 60},
    # Max leaderboard fetches per IP per minute
    "leaderboard":   {"max": 30, "window_secs": 60},
}


# ─── Redis backend ────────────────────────────────────────────────────────────

try:
    import redis.asyncio as aioredis
    _redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    _redis: Optional[aioredis.Redis] = aioredis.from_url(_redis_url, decode_responses=True)
    _use_redis = True
except ImportError:
    _redis = None
    _use_redis = False


# ─── In-memory fallback ───────────────────────────────────────────────────────

_memory_store: dict[str, list[float]] = defaultdict(list)
_store_lock = asyncio.Lock()


# ─── Core rate limit check ────────────────────────────────────────────────────

async def check_rate_limit(
    action: str,
    key: str,
) -> tuple[bool, int]:
    """
    Check if `key` is within rate limits for `action`.

    Returns:
        (allowed: bool, retry_after_secs: int)
    """
    limit = LIMITS.get(action)
    if not limit:
        return True, 0

    max_requests = limit["max"]
    window = limit["window_secs"]
    redis_key = f"rl:{action}:{key}"

    if _use_redis and _redis:
        return await _check_redis(redis_key, max_requests, window)
    else:
        return await _check_memory(redis_key, max_requests, window)


async def _check_redis(key: str, max_req: int, window: int) -> tuple[bool, int]:
    """Redis sliding window rate limiter."""
    try:
        now = time.time()
        pipe = _redis.pipeline()
        # Remove expired entries
        pipe.zremrangebyscore(key, 0, now - window)
        # Count current window
        pipe.zcard(key)
        # Add current request
        pipe.zadd(key, {str(now): now})
        # Set expiry
        pipe.expire(key, window)
        results = await pipe.execute()

        count = results[1]
        if count >= max_req:
            oldest = await _redis.zrange(key, 0, 0, withscores=True)
            retry_after = int(window - (now - oldest[0][1])) if oldest else window
            return False, retry_after

        return True, 0
    except Exception as e:
        log.warning("rate_limit.redis_error", error=str(e))
        # Fail open — don't block requests if Redis is down
        return True, 0


async def _check_memory(key: str, max_req: int, window: int) -> tuple[bool, int]:
    """In-memory sliding window fallback."""
    async with _store_lock:
        now = time.time()
        cutoff = now - window
        # Remove expired timestamps
        _memory_store[key] = [t for t in _memory_store[key] if t > cutoff]

        if len(_memory_store[key]) >= max_req:
            oldest = _memory_store[key][0]
            retry_after = int(window - (now - oldest))
            return False, max(retry_after, 1)

        _memory_store[key].append(now)
        return True, 0


# ─── FastAPI dependency ───────────────────────────────────────────────────────

from fastapi import HTTPException, Request, status


async def rate_limit_push(void_id: str) -> None:
    allowed, retry = await check_rate_limit("push_register", void_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many pushes from this ghost. Retry after {retry}s.",
            headers={"Retry-After": str(retry)},
        )


async def rate_limit_review(review_token: str) -> None:
    allowed, retry = await check_rate_limit("review_submit", review_token)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many reviews. Retry after {retry}s.",
            headers={"Retry-After": str(retry)},
        )


async def rate_limit_score(void_id: str) -> None:
    allowed, retry = await check_rate_limit("score_fetch", void_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many score requests. Retry after {retry}s.",
            headers={"Retry-After": str(retry)},
        )


async def rate_limit_leaderboard(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    allowed, retry = await check_rate_limit("leaderboard", ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many leaderboard requests. Retry after {retry}s.",
            headers={"Retry-After": str(retry)},
        )
