"""Tests for score engine API."""

import pytest
from httpx import AsyncClient, ASGITransport
from voidpush_score_engine.main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["ok"] is True


@pytest.mark.asyncio
async def test_register_push(client: AsyncClient):
    resp = await client.post("/api/v1/push", json={
        "void_id":  "void_test1234",
        "push_hash": "abc123def456",
        "repo_url":  "void://test/repo",
        "branch":    "main",
    })
    assert resp.status_code == 201
    assert resp.json()["ok"] is True


@pytest.mark.asyncio
async def test_submit_review(client: AsyncClient):
    # First register a push
    await client.post("/api/v1/push", json={
        "void_id":  "void_test1234",
        "push_hash": "reviewable001",
        "repo_url":  "void://test/repo",
        "branch":    "main",
    })

    # Submit a review
    resp = await client.post("/api/v1/review", json={
        "push_hash":   "reviewable001",
        "readability": 9.0,
        "correctness": 8.5,
        "style":       9.0,
        "feedback":    "Clean and readable",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["ok"] is True
    assert "review_token" in data


@pytest.mark.asyncio
async def test_get_score(client: AsyncClient):
    # Register + review first
    await client.post("/api/v1/push", json={
        "void_id": "void_scoretest",
        "push_hash": "scoreable001",
        "repo_url": "void://test/repo",
        "branch": "main",
    })
    await client.post("/api/v1/review", json={
        "push_hash": "scoreable001",
        "readability": 9.5,
        "correctness": 9.0,
        "style": 8.5,
    })

    resp = await client.get("/api/v1/score/void_scoretest")
    assert resp.status_code == 200
    data = resp.json()
    assert data["void_id"] == "void_scoretest"
    assert data["score"] > 0
    assert data["reviewer_count"] == 1


@pytest.mark.asyncio
async def test_leaderboard(client: AsyncClient):
    resp = await client.get("/api/v1/leaderboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "ghosts" in data
    assert "period" in data
