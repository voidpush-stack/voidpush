"""Initial migration — create void_scores, blind_reviews, void_ranks tables

Revision ID: 0001_initial
Revises: 
Create Date: 2026-05-01 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── void_scores ──────────────────────────────────────────────────
    op.create_table(
        "void_scores",
        sa.Column("id",             sa.Integer(),     primary_key=True, autoincrement=True),
        sa.Column("void_id",       sa.String(32),    nullable=False),
        sa.Column("push_hash",      sa.String(64),    nullable=False, unique=True),
        sa.Column("repo_url",       sa.String(512),   nullable=False),
        sa.Column("branch",         sa.String(128),   nullable=False),
        sa.Column("pr_id",          sa.Integer(),     nullable=True),
        sa.Column("score",          sa.Float(),       nullable=False, server_default="0.0"),
        sa.Column("readability",    sa.Float(),       nullable=False, server_default="0.0"),
        sa.Column("correctness",    sa.Float(),       nullable=False, server_default="0.0"),
        sa.Column("style",          sa.Float(),       nullable=False, server_default="0.0"),
        sa.Column("reviewer_count", sa.Integer(),     nullable=False, server_default="0"),
        sa.Column("feedback",       sa.JSON(),        nullable=False, server_default="[]"),
        sa.Column("zk_proof",       sa.Text(),        nullable=True),
        sa.Column("zk_chain_id",    sa.String(64),    nullable=True),
        sa.Column("created_at",     sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at",     sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index("ix_void_scores_void_id",   "void_scores", ["void_id"])
    op.create_index("ix_void_scores_push_hash",  "void_scores", ["push_hash"], unique=True)
    op.create_index("ix_void_scores_zk_chain",   "void_scores", ["zk_chain_id"])

    # ── blind_reviews ─────────────────────────────────────────────────
    op.create_table(
        "blind_reviews",
        sa.Column("id",           sa.Integer(),  primary_key=True, autoincrement=True),
        sa.Column("push_hash",    sa.String(64), nullable=False),
        sa.Column("readability",  sa.Float(),    nullable=False),
        sa.Column("correctness",  sa.Float(),    nullable=False),
        sa.Column("style",        sa.Float(),    nullable=False),
        sa.Column("feedback",     sa.Text(),     nullable=True),
        sa.Column("review_token", sa.String(64), nullable=False, unique=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_blind_reviews_push_hash",    "blind_reviews", ["push_hash"])
    op.create_index("ix_blind_reviews_review_token", "blind_reviews", ["review_token"], unique=True)

    # ── void_ranks ───────────────────────────────────────────────────
    op.create_table(
        "void_ranks",
        sa.Column("id",            sa.Integer(),  primary_key=True, autoincrement=True),
        sa.Column("void_id",      sa.String(32), nullable=False),
        sa.Column("zk_chain_id",   sa.String(64), nullable=True),
        sa.Column("avg_score",     sa.Float(),    nullable=False),
        sa.Column("total_commits", sa.Integer(),  nullable=False, server_default="0"),
        sa.Column("total_prs",     sa.Integer(),  nullable=False, server_default="0"),
        sa.Column("streak_days",   sa.Integer(),  nullable=False, server_default="0"),
        sa.Column("region",        sa.String(8),  nullable=True),
        sa.Column("rank_weekly",   sa.Integer(),  nullable=True),
        sa.Column("rank_alltime",  sa.Integer(),  nullable=True),
        sa.Column("period_start",  sa.DateTime(timezone=True), nullable=False),
        sa.Column("period_end",    sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at",    sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_void_ranks_void_id", "void_ranks", ["void_id"])


def downgrade() -> None:
    op.drop_table("void_ranks")
    op.drop_table("blind_reviews")
    op.drop_table("void_scores")
