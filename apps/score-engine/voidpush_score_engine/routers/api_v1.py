"""
VoidPush Score Engine — API v1
Stable, versioned, rate-limited.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from typing import Optional

from voidpush_score_engine.services.rate_limiter import (
    rate_limit_leaderboard,
    rate_limit_push,
    rate_limit_score,
)
from voidpush_score_engine.routers.scores import (
    register_push,
    get_score,
    get_score_history,
    PushRegistrationRequest,
)
from voidpush_score_engine.routers.reviews import submit_review, ReviewRequest
from voidpush_score_engine.routers.leaderboard import get_leaderboard, get_network_stats

router = APIRouter(prefix="/v1", tags=["api-v1"])

# ─── Version info ─────────────────────────────────────────────────────────────

@router.get("/")
async def api_info() -> dict:
    return {
        "version":     "1.0.0",
        "status":      "stable",
        "endpoints": [
            "POST   /v1/push",
            "POST   /v1/review",
            "GET    /v1/score/{void_id}",
            "GET    /v1/score/{void_id}/history",
            "GET    /v1/leaderboard",
            "GET    /v1/stats",
            "GET    /v1/verify-proof",
        ],
        "rate_limits": {
            "push_register": "10/hour per void_id",
            "review_submit": "20/hour per token",
            "score_fetch":   "60/min per void_id",
            "leaderboard":   "30/min per IP",
        },
    }


# ─── Push registration ────────────────────────────────────────────────────────

@router.post("/push", status_code=status.HTTP_201_CREATED)
async def v1_register_push(req: PushRegistrationRequest, db=Depends(__import__("voidpush_score_engine.models.database", fromlist=["get_db"]).get_db)) -> dict:
    await rate_limit_push(req.void_id)
    return await register_push(req, db)


# ─── Review submission ────────────────────────────────────────────────────────

@router.post("/review", status_code=status.HTTP_201_CREATED)
async def v1_submit_review(req: ReviewRequest, db=Depends(__import__("voidpush_score_engine.models.database", fromlist=["get_db"]).get_db)):
    return await submit_review(req, db)


# ─── Score retrieval ──────────────────────────────────────────────────────────

@router.get("/score/{void_id}")
async def v1_get_score(
    void_id: str,
    pr: Optional[int] = Query(None),
    db=Depends(__import__("voidpush_score_engine.models.database", fromlist=["get_db"]).get_db),
):
    await rate_limit_score(void_id)
    return await get_score(void_id, pr, db)


@router.get("/score/{void_id}/history")
async def v1_score_history(
    void_id: str,
    limit: int = Query(10, ge=1, le=50),
    db=Depends(__import__("voidpush_score_engine.models.database", fromlist=["get_db"]).get_db),
):
    await rate_limit_score(void_id)
    return await get_score_history(void_id, limit, db)


# ─── Leaderboard ─────────────────────────────────────────────────────────────

@router.get("/leaderboard")
async def v1_leaderboard(
    request: Request,
    period: str = Query("week", pattern="^(week|month|alltime)$"),
    limit:  int = Query(20, ge=1, le=100),
    region: Optional[str] = Query(None),
    db=Depends(__import__("voidpush_score_engine.models.database", fromlist=["get_db"]).get_db),
):
    await rate_limit_leaderboard(request)
    return await get_leaderboard(period, limit, region, db)


@router.get("/stats")
async def v1_stats(
    db=Depends(__import__("voidpush_score_engine.models.database", fromlist=["get_db"]).get_db),
):
    return await get_network_stats(db)


# ─── ZK proof verification ────────────────────────────────────────────────────

class ProofVerifyRequest(BaseModel):
    void_id:   str = Field(..., min_length=8, max_length=32)
    chain_id:   str = Field(..., min_length=8, max_length=64)
    commitment: str = Field(..., min_length=8, max_length=64)
    proof: dict     = Field(...)


@router.post("/verify-proof")
async def v1_verify_proof(req: ProofVerifyRequest) -> dict:
    """
    Verify a ZK proof of contribution.
    Used by repos to confirm a ghost has contributed before
    without revealing their identity.
    """
    from voidpush_score_engine.services.zk_verifier import verify_ghost_proof

    valid = verify_ghost_proof(
        void_id=req.void_id,
        chain_id=req.chain_id,
        commitment=req.commitment,
        proof=req.proof,
    )

    return {
        "valid":    valid,
        "void_id": req.void_id,
        "chain_id": req.chain_id,
        "message":  "Proof valid — contributor identity protected." if valid else "Proof invalid.",
    }
