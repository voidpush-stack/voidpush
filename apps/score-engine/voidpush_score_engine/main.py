"""
VoidPush Score Engine
Blind code review aggregation and anonymous reputation service.
"""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from voidpush_score_engine.routers import reviews, scores, leaderboard, health
from voidpush_score_engine.models.database import init_db

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    log.info("score_engine.starting")
    await init_db()
    log.info("score_engine.ready")
    yield
    log.info("score_engine.shutdown")


app = FastAPI(
    title="VoidPush Score Engine",
    description="Blind code review aggregation and anonymous reputation service.",
    version="0.1.0",
    lifespan=lifespan,
    # Don't expose OpenAPI in prod — no identity leakage via schema
    docs_url="/docs" if __import__("os").getenv("ENV") != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://voidpush.dev", "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(reviews.router,     prefix="/api/v1")
app.include_router(scores.router,      prefix="/api/v1")
app.include_router(leaderboard.router, prefix="/api/v1")
