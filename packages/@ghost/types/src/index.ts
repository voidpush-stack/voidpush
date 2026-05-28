// ─── Identity ─────────────────────────────────────────────────────────────────

export interface VoidIdentity {
  /** Short human-readable ID, e.g. "void_7f3a2b9c" */
  id: string;
  /** Ed25519 public key, base64url encoded */
  publicKey: string;
  /** Unix timestamp (seconds) when identity expires */
  expiresAt: number;
  /** Whether this identity is linked to a ZK reputation chain */
  zkLinked: boolean;
  /** Preferred relay region */
  region?: "ap" | "eu" | "us" | "sa" | "auto";
}

export type IdentityStatus = "active" | "expired" | "expiring_soon";

export function identityStatus(identity: VoidIdentity): IdentityStatus {
  const now = Math.floor(Date.now() / 1000);
  const ttl = identity.expiresAt - now;
  if (ttl <= 0) return "expired";
  if (ttl < 3600) return "expiring_soon"; // < 1h left
  return "active";
}

// ─── Relay Network ────────────────────────────────────────────────────────────

export type RelayRegion = "ap" | "eu" | "us" | "sa" | "af";

export interface RelayNode {
  /** e.g. "R1" */
  id: string;
  city: string;
  country: string;
  /** ISO 3166-1 alpha-2 */
  countryCode: string;
  region: RelayRegion;
  /** Average RTT in milliseconds */
  latencyMs: number;
  /** 0–10 trust score based on uptime + community votes */
  trustScore: number;
  /** Rolling 30-day uptime percentage */
  uptimePct: number;
  /** Whether this is a community-run or core-network node */
  type: "core" | "community";
  online: boolean;
}

export interface RelayChain {
  hops: RelayNode[];
  totalLatencyMs: number;
  /** ISO timestamp when chain was selected */
  selectedAt: string;
}

// ─── Code Quality & Scoring ───────────────────────────────────────────────────

export interface ScoreBreakdown {
  readability: number;
  correctness: number;
  style: number;
  testCoverage?: number;
}

export interface VoidScore {
  ghostId: string;
  /** 0–10 */
  score: number;
  breakdown: ScoreBreakdown;
  reviewerCount: number;
  /** Rank within the current week */
  rankWeekly: number;
  /** All-time rank */
  rankAllTime: number;
  /** Optional blind feedback strings from reviewers */
  feedback: string[];
  /** ISO timestamp */
  scoredAt: string;
  zkProofUpdated: boolean;
}

// ─── Repos & Contributions ────────────────────────────────────────────────────

export interface GhostRepo {
  /** void://org/repo format */
  url: string;
  name: string;
  org: string;
  description?: string;
  defaultBranch: string;
  /** Total anonymous commits */
  commitCount: number;
  /** Number of unique ghost IDs that contributed */
  ghostContributors: number;
  /** Average quality score across all reviewed pushes */
  avgScore: number;
  isPublic: boolean;
  createdAt: string;
}

export interface GhostPR {
  id: number;
  repoUrl: string;
  title: string;
  description?: string;
  /** Always "anonymous" — no author info exposed */
  author: "anonymous";
  ghostId: string;
  sourceBranch: string;
  targetBranch: string;
  status: "open" | "merged" | "closed" | "draft";
  reviewerCount: number;
  score?: VoidScore;
  createdAt: string;
  mergedAt?: string;
}

export interface GhostPush {
  /** Hash identifying the push (not a git commit hash — internal tracking) */
  pushId: string;
  repoUrl: string;
  branch: string;
  ghostId: string;
  commitCount: number;
  relayChain: RelayChain;
  /** Whether metadata stripping completed successfully */
  metadataStripped: boolean;
  score?: VoidScore;
  pushedAt: string;
}

// ─── Live Feed ────────────────────────────────────────────────────────────────

export type FeedEventType = "push" | "pr_open" | "pr_merge" | "pr_close" | "review";

export interface FeedEvent {
  id: string;
  type: FeedEventType;
  ghostId: string;
  repoUrl: string;
  /** Short human-readable description */
  summary: string;
  score?: number;
  timestamp: string;
}

// ─── Network Stats ────────────────────────────────────────────────────────────

export interface NetworkStats {
  activeGhosts: number;
  totalAnonymousCommits: number;
  anonymityRatePct: number;
  activeRelays: number;
  avgLatencyMs: number;
  feedEvents: FeedEvent[];
  topGhosts: Array<{ ghostId: string; score: number; rank: number }>;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  /** ISO timestamp */
  timestamp: string;
}

export type RelayListResponse = ApiResponse<{ relays: RelayNode[] }>;
export type ScoreResponse = ApiResponse<VoidScore>;
export type NetworkStatsResponse = ApiResponse<NetworkStats>;
export type FeedResponse = ApiResponse<{ events: FeedEvent[] }>;
