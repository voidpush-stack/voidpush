"""
VoidPush Score Engine
Blind code review aggregation and anonymous reputation service.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import os

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from voidpush_score_engine.models.database import init_db
from voidpush_score_engine.routers import health, leaderboard, reviews, scores

log = structlog.get_logger()


def cors_origins() -> list[str]:
    """Read comma-separated CORS origins from env with local-safe defaults."""
    raw = os.getenv("CORS_ORIGINS")
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return ["https://voidpush.dev", "http://localhost:3000", "http://127.0.0.1:3000"]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown lifecycle."""
    _ = app
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
    # Do not expose OpenAPI in prod.
    docs_url="/docs" if os.getenv("ENV") != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(scores.router, prefix="/api/v1")
app.include_router(leaderboard.router, prefix="/api/v1")
