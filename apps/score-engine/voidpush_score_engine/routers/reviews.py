"""
Review submission endpoint.
Reviewers submit blind reviews — no identity, only a one-time token.
"""

import hashlib
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from voidpush_score_engine.models.database import BlindReview, VoidScore, get_db

router = APIRouter(tags=["reviews"])


class ReviewRequest(BaseModel):
    """Blind review submission — no reviewer identity stored."""
    push_hash:   str   = Field(..., min_length=16, max_length=64, description="Hash identifying the push")
    readability: float = Field(..., ge=0.0, le=10.0)
    correctness: float = Field(..., ge=0.0, le=10.0)
    style:       float = Field(..., ge=0.0, le=10.0)
    feedback:    Optional[str] = Field(None, max_length=500)

    @field_validator("push_hash")
    @classmethod
    def sanitize_hash(cls, v: str) -> str:
        # Only allow hex chars
        if not all(c in "0123456789abcdefABCDEF-_" for c in v):
            raise ValueError("Invalid push_hash format")
        return v.lower()


class ReviewResponse(BaseModel):
    ok: bool
    review_token: str
    message: str


class ReviewTokenRequest(BaseModel):
    """Request a one-time review token for a given push."""
    push_hash: str


@router.post("/review", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def submit_review(
    req: ReviewRequest,
    db: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    """
    Submit a blind code review.
    - No reviewer authentication required
    - One-time token prevents duplicate reviews
    - Reviewer identity is never stored
    """
    # Check push exists
    push_score = await db.scalar(
        select(VoidScore).where(VoidScore.push_hash == req.push_hash)
    )
    if push_score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Push not found — it may not have been submitted yet",
        )

    # Generate one-time review token
    review_token = secrets.token_hex(32)

    # Store review
    review = BlindReview(
        push_hash=req.push_hash,
        readability=req.readability,
        correctness=req.correctness,
        style=req.style,
        feedback=req.feedback,
        review_token=review_token,
    )
    db.add(review)

    # Recompute aggregated score
    await _update_aggregate_score(db, req.push_hash, push_score)

    await db.commit()

    return ReviewResponse(
        ok=True,
        review_token=review_token,
        message="Review submitted. Code judged. Identity unknown.",
    )


async def _update_aggregate_score(
    db: AsyncSession,
    push_hash: str,
    ghost_score: VoidScore,
) -> None:
    """Recompute the aggregate score from all blind reviews."""
    result = await db.execute(
        select(
            func.avg(BlindReview.readability).label("avg_read"),
            func.avg(BlindReview.correctness).label("avg_corr"),
            func.avg(BlindReview.style).label("avg_style"),
            func.count(BlindReview.id).label("count"),
            func.array_agg(BlindReview.feedback).label("feedbacks"),
        ).where(BlindReview.push_hash == push_hash)
    )
    row = result.one()

    if row.count == 0:
        return

    avg_read = float(row.avg_read or 0)
    avg_corr = float(row.avg_corr or 0)
    avg_style = float(row.avg_style or 0)

    # Weighted average: correctness 40%, readability 35%, style 25%
    overall = (avg_corr * 0.40) + (avg_read * 0.35) + (avg_style * 0.25)

    ghost_score.score         = round(overall, 1)
    ghost_score.readability   = round(avg_read, 1)
    ghost_score.correctness   = round(avg_corr, 1)
    ghost_score.style         = round(avg_style, 1)
    ghost_score.reviewer_count = int(row.count)
    ghost_score.feedback      = [f for f in (row.feedbacks or []) if f]
