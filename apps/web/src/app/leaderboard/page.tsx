"use client";

import { useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const GHOSTS = [
  { id: "void_3c7e", score: 9.8, rank: 1,  commits: 47, prs: 12, streak: 14, region: "ap", breakdown: { readability: 9.9, correctness: 9.7, style: 9.8 } },
  { id: "void_d91c", score: 9.7, rank: 2,  commits: 31, prs: 8,  streak: 31, region: "eu", breakdown: { readability: 9.6, correctness: 9.9, style: 9.6 } },
  { id: "void_b91d", score: 9.5, rank: 3,  commits: 22, prs: 6,  streak: 9,  region: "us", breakdown: { readability: 9.4, correctness: 9.6, style: 9.5 } },
  { id: "void_a40f", score: 9.4, rank: 4,  commits: 38, prs: 9,  streak: 22, region: "ap", breakdown: { readability: 9.5, correctness: 9.2, style: 9.4 } },
  { id: "void_f55a", score: 9.2, rank: 5,  commits: 19, prs: 4,  streak: 8,  region: "sa", breakdown: { readability: 9.1, correctness: 9.4, style: 9.1 } },
  { id: "void_09e2", score: 9.1, rank: 6,  commits: 55, prs: 15, streak: 41, region: "eu", breakdown: { readability: 9.0, correctness: 9.3, style: 9.0 } },
  { id: "void_22b8", score: 8.9, rank: 7,  commits: 14, prs: 3,  streak: 5,  region: "ap", breakdown: { readability: 8.8, correctness: 9.0, style: 8.9 } },
  { id: "void_1a4d", score: 8.7, rank: 8,  commits: 28, prs: 7,  streak: 17, region: "eu", breakdown: { readability: 8.6, correctness: 8.9, style: 8.6 } },
  { id: "void_7c9b", score: 8.6, rank: 9,  commits: 11, prs: 2,  streak: 3,  region: "us", breakdown: { readability: 8.7, correctness: 8.5, style: 8.6 } },
  { id: "void_e32a", score: 8.4, rank: 10, commits: 33, prs: 11, streak: 12, region: "ap", breakdown: { readability: 8.3, correctness: 8.6, style: 8.3 } },
  { id: "void_4f1d", score: 8.2, rank: 11, commits: 9,  prs: 1,  streak: 2,  region: "sa", breakdown: { readability: 8.1, correctness: 8.4, style: 8.1 } },
  { id: "ghost_c77a", score: 8.1, rank: 12, commits: 16, prs: 5,  streak: 7,  region: "eu", breakdown: { readability: 8.2, correctness: 8.0, style: 8.1 } },
];

const REGION_COLOR: Record<string, string> = {
  ap: "var(--ghost)", eu: "var(--teal)", us: "var(--blue)", sa: "var(--yellow)",
};

type SortKey = "score" | "commits" | "prs" | "streak";

export default function LeaderboardPage() {
  const [sort, setSort] = useState<SortKey>("score");
  const [selected, setSelected] = useState<string | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "alltime">("week");

  const sorted = [...GHOSTS].sort((a, b) => b[sort] - a[sort]);
  const selectedGhost = GHOSTS.find(g => g.id === selected);

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "3rem 2rem 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="s-tag">Leaderboard</div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              Top ghosts.<br />No names. Just signal.
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, maxWidth: 520 }}>
              Ranked purely by blind code review scores. No follower count. No GitHub profile. No country of origin. Just code quality.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            {/* Period */}
            <div style={{ display: "flex", gap: "2px", border: "1px solid var(--border)", background: "var(--bg2)", padding: "3px" }}>
              {(["week","month","alltime"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: "0.4rem 1rem", background: period === p ? "var(--ghost)" : "transparent", color: period === p ? "var(--bg)" : "var(--muted)", border: "none", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.15s" }}>
                  {p === "alltime" ? "all time" : p}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>sort by</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {(["score","commits","prs","streak"] as const).map(s => (
                  <button key={s} onClick={() => setSort(s)}
                    style={{ padding: "0.35rem 0.75rem", border: `1px solid ${sort === s ? "var(--ghost)" : "var(--border)"}`, background: sort === s ? "rgba(167,139,250,0.1)" : "transparent", color: sort === s ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.63rem", transition: "all 0.15s" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Podium — top 3 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", marginBottom: "1px" }}>
            {sorted.slice(0, 3).map((ghost, i) => (
              <div key={ghost.id}
                onClick={() => setSelected(selected === ghost.id ? null : ghost.id)}
                style={{ padding: "2rem", background: i === 0 ? "rgba(167,139,250,0.08)" : "var(--bg2)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                {i === 0 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,var(--ghost2),var(--ghost))" }} />}
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>
                  #{ghost.rank} {i === 0 ? "👑" : i === 1 ? "🥈" : "🥉"}
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "1rem", color: "var(--ghost)", marginBottom: "0.5rem", fontWeight: 700 }}>
                  {ghost.id}
                </div>
                <div style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, color: i === 0 ? "var(--ghost)" : "var(--text)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.75rem" }}>
                  {ghost.score}
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.65rem", color: "var(--muted)" }}>
                  <span><span style={{ color: "var(--teal)" }}>{ghost.commits}</span> commits</span>
                  <span><span style={{ color: "var(--teal)" }}>{ghost.prs}</span> PRs</span>
                  <span><span style={{ color: "var(--green)" }}>{ghost.streak}d</span> streak</span>
                </div>
              </div>
            ))}
          </div>

          {/* Full table */}
          <div style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 80px 80px 80px 80px 80px", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span>Rank</span><span>Ghost ID</span><span>Score</span><span>Commits</span><span>PRs</span><span>Streak</span><span>Region</span>
            </div>
            {sorted.slice(3).map((ghost) => (
              <div key={ghost.id}
                onClick={() => setSelected(selected === ghost.id ? null : ghost.id)}
                style={{ display: "grid", gridTemplateColumns: "50px 1fr 80px 80px 80px 80px 80px", padding: "0.875rem 1rem", borderBottom: "1px solid rgba(167,139,250,0.05)", fontSize: "0.75rem", cursor: "pointer", background: selected === ghost.id ? "rgba(167,139,250,0.04)" : "transparent", transition: "background 0.15s" }}>
                <span style={{ color: "var(--muted)" }}>#{ghost.rank}</span>
                <span style={{ color: "var(--ghost)", fontFamily: "var(--mono)" }}>{ghost.id}</span>
                <span style={{ color: "var(--teal)", fontWeight: 700 }}>{ghost.score}</span>
                <span style={{ color: "var(--muted)" }}>{ghost.commits}</span>
                <span style={{ color: "var(--muted)" }}>{ghost.prs}</span>
                <span style={{ color: "var(--green)" }}>{ghost.streak}d</span>
                <span style={{ fontSize: "0.63rem", color: REGION_COLOR[ghost.region], textTransform: "uppercase" }}>{ghost.region}</span>
              </div>
            ))}
          </div>

          {/* Selected ghost detail */}
          {selectedGhost && (
            <div style={{ marginTop: "1.5rem", border: "1px solid var(--border)", background: "var(--bg2)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "1rem", color: "var(--ghost)", fontWeight: 700 }}>{selectedGhost.id}</span>
                <span style={{ fontSize: "0.63rem", color: "var(--muted)" }}>rank #{selectedGhost.rank} · {period === "week" ? "this week" : period === "month" ? "this month" : "all time"}</span>
              </div>

              {/* Score breakdown */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Score breakdown</div>
                {Object.entries(selectedGhost.breakdown).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--muted)", minWidth: 90, textTransform: "capitalize" }}>{key}</span>
                    <div style={{ flex: 1, height: 4, background: "var(--bg)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(val / 10) * 100}%`, background: "linear-gradient(90deg,var(--ghost2),var(--ghost))", borderRadius: 2, transition: "width 0.5s ease" }} />
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--ghost)", minWidth: 30, textAlign: "right", fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
                {[
                  { label: "Total commits", val: selectedGhost.commits },
                  { label: "Merged PRs",    val: selectedGhost.prs },
                  { label: "Day streak",    val: `${selectedGhost.streak}d` },
                  { label: "Region",        val: selectedGhost.region.toUpperCase() },
                ].map(({ label, val }) => (
                  <div key={label} style={{ padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>{label}</div>
                    <div style={{ fontSize: "1.1rem", fontFamily: "var(--display)", fontWeight: 700, color: "var(--ghost)" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer note */}
          <div style={{ marginTop: "2rem", padding: "1rem 1.25rem", border: "1px solid var(--border)", background: "var(--bg2)", fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.8 }}>
            <span style={{ color: "var(--ghost)" }}>// </span>
            All rankings are based on blind code review scores. Ghost IDs are ephemeral and rotate every 72h — a ghost's rank reflects their ZK-linked reputation across sessions, not a persistent identity. No real names are stored anywhere in this system.
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
