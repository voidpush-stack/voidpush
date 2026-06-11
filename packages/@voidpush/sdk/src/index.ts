/**
 * @voidpush/sdk
 * VoidPush TypeScript SDK — anonymous code contribution
 *
 * @example
 * ```ts
 * import { VoidPushClient } from "@voidpush/sdk";
 *
 * const client = new VoidPushClient({ apiUrl: "https://api.voidpush.dev" });
 *
 * // Register an anonymous push for review
 * await client.registerPush({
 *   voidId: "void_7f3a2b9c",
 *   pushHash: "abc123",
 *   repoUrl: "void://org/repo",
 *   branch: "main",
 * });
 *
 * // Fetch quality score
 * const score = await client.getScore("void_7f3a2b9c");
 * console.log(score.score); // 9.4
 * ```
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoidPushConfig {
  /** Score engine API URL. Default: https://api.voidpush.dev */
  apiUrl?: string;
  /** Request timeout in ms. Default: 10000 */
  timeoutMs?: number;
  /** Custom fetch implementation (for Node.js < 18 compat) */
  fetch?: typeof globalThis.fetch;
}

export interface PushRegistration {
  voidId:     string;
  pushHash:   string;
  repoUrl:    string;
  branch:     string;
  prId?:      number;
  zkProof?:   string;
  zkChainId?: string;
}

export interface ScoreBreakdown {
  readability: number;
  correctness: number;
  style:       number;
}

export interface VoidScore {
  voidId:        string;
  pushHash:      string;
  repoUrl:       string;
  score:         number;
  breakdown:     ScoreBreakdown;
  reviewerCount: number;
  feedback:      string[];
  rankWeekly:    number | null;
  rankAllTime:   number | null;
  zkUpdated:     boolean;
  scoredAt:      string;
}

export interface BlindReview {
  pushHash:    string;
  readability: number;
  correctness: number;
  style:       number;
  feedback?:   string;
}

export interface LeaderboardEntry {
  voidId:       string;
  rank:         number;
  avgScore:     number;
  totalCommits: number;
  totalPrs:     number;
  streakDays:   number;
  region?:      string;
}

export interface LeaderboardResponse {
  period: string;
  total:  number;
  ghosts: LeaderboardEntry[];
}

export interface NetworkStats {
  activeContributors:  number;
  totalAnonCommits:    number;
  anonymityRatePct:    number;
  activeRelays:        number;
}

export type LeaderboardPeriod = "week" | "month" | "alltime";

// ─── Errors ───────────────────────────────────────────────────────────────────

export class VoidPushError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = "VoidPushError";
  }
}

export class RateLimitError extends VoidPushError {
  constructor(public readonly retryAfterSecs: number) {
    super(`Rate limited. Retry after ${retryAfterSecs}s`, 429);
    this.name = "RateLimitError";
  }
}

export class ScoreNotReadyError extends VoidPushError {
  constructor() {
    super("Score not yet available. Wait up to 24h after push.", 404);
    this.name = "ScoreNotReadyError";
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class VoidPushClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(config: VoidPushConfig = {}) {
    this.baseUrl   = (config.apiUrl ?? "https://api.voidpush.dev").replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this._fetch    = config.fetch ?? globalThis.fetch;
  }

  // ─── Push ──────────────────────────────────────────────────────────────────

  /**
   * Register an anonymous push for blind review.
   * Called by vpush CLI after a successful push.
   */
  async registerPush(push: PushRegistration): Promise<{ ok: boolean; pushHash: string }> {
    const res = await this._request("POST", "/v1/push", {
      void_id:    push.voidId,
      push_hash:  push.pushHash,
      repo_url:   push.repoUrl,
      branch:     push.branch,
      pr_id:      push.prId,
      zk_proof:   push.zkProof,
      zk_chain_id: push.zkChainId,
    });
    return { ok: res.ok, pushHash: res.push_hash };
  }

  // ─── Review ────────────────────────────────────────────────────────────────

  /**
   * Submit a blind code review.
   * No authentication required — one-time review token returned.
   */
  async submitReview(review: BlindReview): Promise<{ ok: boolean; reviewToken: string }> {
    const res = await this._request("POST", "/v1/review", {
      push_hash:   review.pushHash,
      readability: review.readability,
      correctness: review.correctness,
      style:       review.style,
      feedback:    review.feedback,
    });
    return { ok: res.ok, reviewToken: res.review_token };
  }

  // ─── Scores ────────────────────────────────────────────────────────────────

  /**
   * Get the latest quality score for a void identity.
   * @throws {ScoreNotReadyError} if score not yet available (wait 24h)
   */
  async getScore(voidId: string, prId?: number): Promise<VoidScore> {
    const query = prId ? `?pr=${prId}` : "";
    const res = await this._request("GET", `/v1/score/${encodeURIComponent(voidId)}${query}`);
    return this._mapScore(res);
  }

  /**
   * Get full score history for a void identity.
   */
  async getScoreHistory(voidId: string, limit = 10): Promise<VoidScore[]> {
    const res = await this._request("GET", `/v1/score/${encodeURIComponent(voidId)}/history?limit=${limit}`);
    return (res.history ?? []).map(this._mapScore);
  }

  // ─── Leaderboard ───────────────────────────────────────────────────────────

  /**
   * Get the anonymous leaderboard.
   */
  async getLeaderboard(opts: {
    period?: LeaderboardPeriod;
    limit?:  number;
    region?: string;
  } = {}): Promise<LeaderboardResponse> {
    const params = new URLSearchParams({
      period: opts.period ?? "week",
      limit:  String(opts.limit ?? 20),
      ...(opts.region ? { region: opts.region } : {}),
    });
    const res = await this._request("GET", `/v1/leaderboard?${params}`);
    return {
      period: res.period,
      total:  res.total,
      ghosts: (res.ghosts ?? []).map((g: Record<string, unknown>) => ({
        voidId:       g.void_id as string,
        rank:         g.rank as number,
        avgScore:     g.avg_score as number,
        totalCommits: g.total_commits as number,
        totalPrs:     g.total_prs as number,
        streakDays:   g.streak_days as number,
        region:       g.region as string | undefined,
      })),
    };
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  /** Get global network stats. */
  async getStats(): Promise<NetworkStats> {
    const res = await this._request("GET", "/v1/stats");
    return {
      activeContributors: res.active_contributors ?? res.active_ghosts ?? 0,
      totalAnonCommits:   res.total_anon_commits ?? 0,
      anonymityRatePct:   res.anonymity_rate_pct ?? 0,
      activeRelays:       res.active_relays ?? 0,
    };
  }

  // ─── ZK Proof ──────────────────────────────────────────────────────────────

  /** Verify a ZK proof of contribution. */
  async verifyProof(opts: {
    voidId:     string;
    chainId:    string;
    commitment: string;
    proof:      Record<string, string>;
  }): Promise<{ valid: boolean; message: string }> {
    const res = await this._request("POST", "/v1/verify-proof", {
      void_id:    opts.voidId,
      chain_id:   opts.chainId,
      commitment: opts.commitment,
      proof:      opts.proof,
    });
    return { valid: res.valid, message: res.message };
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async _request(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this._fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "@voidpush/sdk/1.0.0",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = await res.json() as Record<string, unknown>;

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60");
        throw new RateLimitError(retryAfter);
      }

      if (res.status === 404 && path.includes("/score/")) {
        throw new ScoreNotReadyError();
      }

      if (!res.ok) {
        throw new VoidPushError(
          `API error: ${res.status}`,
          res.status,
          (data.detail as string) ?? (data.error as string),
        );
      }

      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  private _mapScore(res: Record<string, unknown>): VoidScore {
    return {
      voidId:        res.void_id as string,
      pushHash:      res.push_hash as string,
      repoUrl:       res.repo_url as string,
      score:         res.score as number,
      breakdown:     res.breakdown as ScoreBreakdown,
      reviewerCount: res.reviewer_count as number,
      feedback:      (res.feedback as string[]) ?? [],
      rankWeekly:    res.rank_weekly as number | null,
      rankAllTime:   res.rank_alltime as number | null,
      zkUpdated:     res.zk_updated as boolean,
      scoredAt:      res.scored_at as string,
    };
  }
}

// ─── Convenience factory ──────────────────────────────────────────────────────

export function createClient(config?: VoidPushConfig): VoidPushClient {
  return new VoidPushClient(config);
}
