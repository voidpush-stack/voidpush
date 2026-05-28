"""Database setup — async SQLAlchemy with PostgreSQL."""

import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://ghost:ghost@localhost:5432/void_scores",
)

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=10, max_overflow=20)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class VoidScore(Base):
    """Aggregated quality score for a void push or PR."""
    __tablename__ = "void_scores"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    void_id      = Column(String(32), nullable=False, index=True)
    push_hash     = Column(String(64), nullable=False, unique=True, index=True)
    repo_url      = Column(String(512), nullable=False)
    branch        = Column(String(128), nullable=False)
    pr_id         = Column(Integer, nullable=True)

    # Aggregated scores (0.0 – 10.0)
    score         = Column(Float, nullable=False, default=0.0)
    readability   = Column(Float, nullable=False, default=0.0)
    correctness   = Column(Float, nullable=False, default=0.0)
    style         = Column(Float, nullable=False, default=0.0)

    reviewer_count = Column(Integer, nullable=False, default=0)
    feedback       = Column(JSON, nullable=False, default=list)  # list of strings

    # ZK proof linking
    zk_proof      = Column(Text, nullable=True)
    zk_chain_id   = Column(String(64), nullable=True, index=True)

    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())


class BlindReview(Base):
    """Individual reviewer submission — never stores reviewer identity."""
    __tablename__ = "blind_reviews"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    push_hash     = Column(String(64), nullable=False, index=True)

    # Scores submitted by this reviewer (0.0 – 10.0)
    readability   = Column(Float, nullable=False)
    correctness   = Column(Float, nullable=False)
    style         = Column(Float, nullable=False)
    feedback      = Column(Text, nullable=True)

    # Reviewer is identified only by a one-time token — no persistent identity
    review_token  = Column(String(64), nullable=False, unique=True)
    submitted_at  = Column(DateTime(timezone=True), server_default=func.now())


class VoidRank(Base):
    """Weekly and all-time leaderboard rankings — updated periodically."""
    __tablename__ = "void_ranks"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    void_id      = Column(String(32), nullable=False, index=True)
    zk_chain_id   = Column(String(64), nullable=True)

    avg_score     = Column(Float, nullable=False)
    total_commits = Column(Integer, nullable=False, default=0)
    total_prs     = Column(Integer, nullable=False, default=0)
    streak_days   = Column(Integer, nullable=False, default=0)
    region        = Column(String(8), nullable=True)

    rank_weekly   = Column(Integer, nullable=True)
    rank_alltime  = Column(Integer, nullable=True)

    period_start  = Column(DateTime(timezone=True), nullable=False)
    period_end    = Column(DateTime(timezone=True), nullable=True)
    updated_at    = Column(DateTime(timezone=True), server_default=func.now())


async def init_db() -> None:
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency: yield an async DB session."""
    async with AsyncSessionLocal() as session:
        yield session
