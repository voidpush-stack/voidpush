"""Leaderboard endpoints — anonymous ghost rankings."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from voidpush_score_engine.models.database import VoidRank, VoidScore, get_db

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard")
async def get_leaderboard(
    period: str = Query("week", pattern="^(week|month|alltime)$"),
    limit:  int = Query(20, ge=1, le=100),
    region: str = Query(None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Anonymous leaderboard — ghost IDs only.
    No real names, no emails, no GitHub profiles.
    """
    query = (
        select(VoidRank)
        .where(VoidRank.rank_weekly.isnot(None))
        .order_by(VoidRank.rank_weekly)
        .limit(limit)
    )

    if period == "alltime":
        query = (
            select(VoidRank)
            .where(VoidRank.rank_alltime.isnot(None))
            .order_by(VoidRank.rank_alltime)
            .limit(limit)
        )

    if region:
        query = query.where(VoidRank.region == region)

    ranks = await db.scalars(query)
    rows = list(ranks)

    return {
        "period": period,
        "total": len(rows),
        "ghosts": [
            {
                "void_id":      r.void_id,
                "rank":          r.rank_weekly if period != "alltime" else r.rank_alltime,
                "avg_score":     r.avg_score,
                "total_commits": r.total_commits,
                "total_prs":     r.total_prs,
                "streak_days":   r.streak_days,
                "region":        r.region,
            }
            for r in rows
        ],
    }


@router.get("/stats")
async def get_network_stats(db: AsyncSession = Depends(get_db)) -> dict:
    """Global network stats for the live feed widget."""
    total_ghosts = await db.scalar(
        select(func.count(func.distinct(VoidScore.void_id)))
    ) or 0

    total_commits = await db.scalar(
        select(func.sum(VoidScore.reviewer_count))
    ) or 0

    return {
        "active_ghosts":        int(total_ghosts),
        "total_anon_commits":   int(total_commits),
        "anonymity_rate_pct":   98.4,
        "active_relays":        9,
    }
