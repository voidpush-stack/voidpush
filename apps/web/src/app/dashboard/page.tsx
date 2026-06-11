"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

// ─── Mock data ────────────────────────────────────────────────────────────────

const SCORE_HISTORY = [
  { push_hash: "abc123", repo: "void://infra/lb",     branch: "main",  score: 9.4, reviewers: 4, date: "2026-05-22" },
  { push_hash: "def456", repo: "void://web/renderer", branch: "feat",  score: 8.9, reviewers: 3, date: "2026-05-19" },
  { push_hash: "ghi789", repo: "void://auth/tokens",  branch: "fix",   score: 9.7, reviewers: 6, date: "2026-05-15" },
  { push_hash: "jkl012", repo: "void://core/parser",  branch: "main",  score: 8.2, reviewers: 2, date: "2026-05-10" },
  { push_hash: "mno345", repo: "void://db/query",     branch: "perf",  score: 9.1, reviewers: 5, date: "2026-05-05" },
];

const RELAY_HEALTH = [
  { id: "R1", city: "Tokyo",     latency: 12,  status: "healthy", uptime: 99.97 },
  { id: "R3", city: "Frankfurt", latency: 22,  status: "healthy", uptime: 99.99 },
  { id: "R4", city: "Singapore", latency: 18,  status: "healthy", uptime: 99.94 },
  { id: "R5", city: "Amsterdam", latency: 19,  status: "healthy", uptime: 99.98 },
  { id: "R6", city: "Mumbai",    latency: 44,  status: "degraded",uptime: 98.12 },
  { id: "R7", city: "Chicago",   latency: 31,  status: "healthy", uptime: 99.91 },
  { id: "R8", city: "Sydney",    latency: 71,  status: "healthy", uptime: 99.83 },
  { id: "R9", city: "Lagos",     latency: 102, status: "offline", uptime: 94.55 },
];

const STATUS_COLOR: Record<string, string> = {
  healthy:  "var(--green)",
  degraded: "var(--yellow)",
  offline:  "var(--red, #f87171)",
};

function scoreColor(s: number) {
  if (s >= 9.5) return "var(--green)";
  if (s >= 8.5) return "var(--teal)";
  if (s >= 7.0) return "var(--yellow)";
  return "var(--red, #f87171)";
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ val, label, sub }: { val: string; label: string; sub?: string }) {
  return (
    <div style={{ padding: "1.5rem", background: "var(--bg2)", border: "1px solid var(--border)" }}>
      <div style={{ fontFamily: "var(--display)", fontSize: "2rem", fontWeight: 800, color: "var(--ghost)", letterSpacing: "-0.04em", lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: "0.72rem", color: "var(--text)", marginTop: "0.35rem", fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: "0.63rem", color: "var(--muted)", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [voidId, setVoidId] = useState("void_7f3a2b9c");
  const [ttlH,   setTtlH]   = useState(47);
  const [tab,    setTab]     = useState<"scores" | "relays" | "identity">("scores");

  // Tick TTL countdown
  useEffect(() => {
    const t = setInterval(() => setTtlH((h) => Math.max(0, h - 1)), 3_600_000);
    return () => clearInterval(t);
  }, []);

  const avgScore = (SCORE_HISTORY.reduce((s, r) => s + r.score, 0) / SCORE_HISTORY.length).toFixed(1);
  const healthyRelays = RELAY_HEALTH.filter((r) => r.status === "healthy").length;

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "2rem 2rem 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="s-tag">Dashboard</div>
              <h1 style={{ fontFamily: "var(--display)", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                {voidId}
              </h1>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.35rem" }}>
                Identity expires in{" "}
                <span style={{ color: ttlH < 6 ? "var(--yellow)" : "var(--teal)" }}>{ttlH}h</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                style={{ padding: "0.6rem 1.25rem", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "0.72rem", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ghost)"; e.currentTarget.style.color = "var(--ghost)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>
                void verify --json
              </button>
              <button
                style={{ padding: "0.6rem 1.25rem", background: "var(--ghost)", border: "none", color: "var(--bg)", fontFamily: "var(--mono)", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                void init --link
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", marginBottom: "2rem" }}>
            <StatCard val={avgScore} label="Avg quality score" sub={`across ${SCORE_HISTORY.length} pushes`} />
            <StatCard val="#3"       label="Weekly rank"        sub="top 0.1%" />
            <StatCard val={`${healthyRelays}/9`} label="Relays healthy" sub="1 degraded, 1 offline" />
            <StatCard val={`${ttlH}h`} label="Identity TTL"    sub="use void init --link to preserve rep" />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
            {(["scores","relays","identity"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "0.875rem 1.5rem", background: "transparent", border: "none", borderBottom: `2px solid ${tab === t ? "var(--ghost)" : "transparent"}`, color: tab === t ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s" }}>
                {t}
              </button>
            ))}
          </div>

          {/* Score history tab */}
          {tab === "scores" && (
            <div>
              <div style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 80px 80px", padding: "0.5rem 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <span>Repository</span><span>Branch</span><span>Score</span><span>Reviews</span><span>Date</span>
                </div>
                {SCORE_HISTORY.map((push) => (
                  <div key={push.push_hash} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 80px 80px", padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(167,139,250,0.05)", fontSize: "0.75rem", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(167,139,250,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ color: "var(--teal)", fontFamily: "var(--mono)" }}>{push.repo}</span>
                    <span style={{ color: "var(--muted)" }}>{push.branch}</span>
                    <span style={{ color: scoreColor(push.score), fontWeight: 700 }}>{push.score}</span>
                    <span style={{ color: "var(--muted)" }}>{push.reviewers}</span>
                    <span style={{ color: "var(--muted)" }}>{push.date}</span>
                  </div>
                ))}
              </div>

              {/* Score trend chart (SVG) */}
              <div style={{ marginTop: "1.5rem", border: "1px solid var(--border)", background: "var(--bg2)", padding: "1.5rem" }}>
                <div style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Score trend</div>
                <svg viewBox="0 0 600 120" style={{ width: "100%", height: "auto" }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0,30,60,90,120].map(y => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(167,139,250,0.06)" strokeWidth="1"/>
                  ))}
                  {/* Score labels */}
                  {[[0,"10"],[30,"9"],[60,"8"],[90,"7"],[120,"6"]].map(([y,label]) => (
                    <text key={String(y)} x="4" y={Number(y)+4} fontSize="9" fill="#64748b" fontFamily="Space Mono,monospace">{label}</text>
                  ))}
                  {/* Area fill */}
                  <path
                    d="M 60,18 L 180,30 L 300,12 L 420,54 L 540,24 L 540,120 L 60,120 Z"
                    fill="url(#scoreGrad)"
                  />
                  {/* Line */}
                  <polyline
                    points="60,18 180,30 300,12 420,54 540,24"
                    fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round"
                  />
                  {/* Points */}
                  {[[60,18],[180,30],[300,12],[420,54],[540,24]].map(([x,y],i) => (
                    <circle key={i} cx={x} cy={y} r="4" fill="#a78bfa"/>
                  ))}
                  {/* Score labels on points */}
                  {SCORE_HISTORY.map((p,i) => {
                    const x = 60 + i * 120;
                    const y = 120 - ((p.score - 6) / 4) * 120;
                    return <text key={i} x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#a78bfa" fontFamily="Space Mono,monospace">{p.score}</text>;
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Relay health tab */}
          {tab === "relays" && (
            <div style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 90px 100px", padding: "0.5rem 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                <span>ID</span><span>Location</span><span>Latency</span><span>Uptime</span><span>Status</span>
              </div>
              {RELAY_HEALTH.map((relay) => (
                <div key={relay.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 90px 100px", padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(167,139,250,0.05)", fontSize: "0.75rem" }}>
                  <span style={{ color: "var(--ghost)", fontWeight: 700 }}>{relay.id}</span>
                  <span style={{ color: "var(--text)" }}>{relay.city}</span>
                  <span style={{ color: relay.latency < 30 ? "var(--green)" : relay.latency < 80 ? "var(--yellow)" : "var(--muted)" }}>{relay.latency}ms</span>
                  <span style={{ color: "var(--muted)" }}>{relay.uptime}%</span>
                  <span style={{ color: STATUS_COLOR[relay.status] }}>
                    ● {relay.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Identity tab */}
          {tab === "identity" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div style={{ border: "1px solid var(--border)", background: "var(--bg2)", padding: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>Current identity</h3>
                {[
                  { label: "Void ID",    val: voidId },
                  { label: "TTL",        val: `${ttlH}h remaining` },
                  { label: "ZK chain",   val: "linked (4 sessions)" },
                  { label: "Region",     val: "ap (auto)" },
                  { label: "Relay hops", val: "3 (default)" },
                  { label: "Auto-expire",val: "enabled" },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid rgba(167,139,250,0.06)", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--muted)" }}>{label}</span>
                    <span style={{ color: "var(--text)", fontFamily: "var(--mono)" }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ border: "1px solid var(--border)", background: "var(--bg2)", padding: "1.5rem" }}>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>ZK reputation chain</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
                    Your reputation is linked across 4 sessions via ZK proof. Rotating identity will not reset your score.
                  </p>
                  <div style={{ padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: "0.65rem", color: "var(--teal)" }}>
                    chain_id: a4f8c2e1b903...
                  </div>
                </div>
                <div style={{ border: "1px solid rgba(247,65,25,0.2)", background: "rgba(247,65,25,0.04)", padding: "1.5rem" }}>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--red, #f87171)" }}>Danger zone</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "1rem" }}>
                    Expire identity immediately. Cannot be undone.
                  </p>
                  <button style={{ padding: "0.6rem 1.25rem", background: "transparent", border: "1px solid var(--red, #f87171)", color: "var(--red, #f87171)", fontFamily: "var(--mono)", fontSize: "0.72rem", cursor: "pointer" }}>
                    void expire --force
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
