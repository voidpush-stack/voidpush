"""Score retrieval endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from voidpush_score_engine.models.database import VoidScore, VoidRank, get_db
from voidpush_score_engine.services.rate_limiter import rate_limit_push, rate_limit_score

router = APIRouter(tags=["scores"])


class ScoreBreakdown(BaseModel):
    readability: float
    correctness: float
    style:       float


class ScoreResponse(BaseModel):
    void_id:       str
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


class PushRegistrationRequest(BaseModel):
    void_id:    str
    push_hash:   str
    repo_url:    str
    branch:      str
    pr_id:       Optional[int] = None
    zk_proof:    Optional[str] = None
    zk_chain_id: Optional[str] = None


@router.post("/push", status_code=status.HTTP_201_CREATED)
async def register_push(
    req: PushRegistrationRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Register an anonymous push for blind review."""
    # Rate limit per ghost ID
    await rate_limit_push(req.void_id)

    existing = await db.scalar(
        select(VoidScore).where(VoidScore.push_hash == req.push_hash)
    )
    if existing:
        return {"ok": True, "message": "Push already registered", "push_hash": req.push_hash}

    ghost_score = VoidScore(
        void_id=req.void_id,
        push_hash=req.push_hash,
        repo_url=req.repo_url,
        branch=req.branch,
        pr_id=req.pr_id,
        zk_proof=req.zk_proof,
        zk_chain_id=req.zk_chain_id,
    )
    db.add(ghost_score)
    await db.commit()

    return {
        "ok": True,
        "push_hash": req.push_hash,
        "message": "Push registered. Review window: 24h.",
    }


@router.get("/score/{void_id}", response_model=ScoreResponse)
async def get_score(
    void_id: str,
    pr: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> ScoreResponse:
    """Fetch the latest quality score for a ghost identity."""
    await rate_limit_score(void_id)

    query = (
        select(VoidScore)
        .where(VoidScore.void_id == void_id)
        .order_by(desc(VoidScore.created_at))
    )
    if pr is not None:
        query = query.where(VoidScore.pr_id == pr)

    score = await db.scalar(query)
    if score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No score found. Wait up to 24h after push.",
        )

    rank = await db.scalar(
        select(VoidRank)
        .where(VoidRank.void_id == void_id)
        .order_by(desc(VoidRank.updated_at))
    )

    return ScoreResponse(
        void_id=score.void_id,
        push_hash=score.push_hash,
        repo_url=score.repo_url,
        score=score.score,
        breakdown=ScoreBreakdown(
            readability=score.readability,
            correctness=score.correctness,
            style=score.style,
        ),
        reviewer_count=score.reviewer_count,
        feedback=score.feedback or [],
        rank_weekly=rank.rank_weekly if rank else None,
        rank_alltime=rank.rank_alltime if rank else None,
        zk_updated=bool(score.zk_proof),
        scored_at=score.created_at.isoformat() if score.created_at else "",
    )


@router.get("/score/{void_id}/history")
async def get_score_history(
    void_id: str,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Fetch full score history for a ghost identity."""
    await rate_limit_score(void_id)

    scores = await db.scalars(
        select(VoidScore)
        .where(VoidScore.void_id == void_id)
        .order_by(desc(VoidScore.created_at))
        .limit(limit)
    )

    return {
        "void_id": void_id,
        "history": [
            {
                "push_hash":      s.push_hash,
                "repo_url":       s.repo_url,
                "branch":         s.branch,
                "score":          s.score,
                "reviewer_count": s.reviewer_count,
                "scored_at":      s.created_at.isoformat() if s.created_at else "",
            }
            for s in scores
        ],
    }
