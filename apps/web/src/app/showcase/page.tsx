"use client";

import { useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const SHOWCASED = [
  {
    id: 503, repo: "void://infra/loadbalancer", title: "refactor: replace O(n²) connection pool with lock-free ring buffer",
    score: 9.9, reviews: 6, merged: "3 days ago", lang: "Rust",
    lines: { added: 312, removed: 489 },
    feedback: ["Best refactor I've seen this quarter. Zero allocation on hot path.", "Elegant use of cache-line padding. Clearly knows the hardware."],
    tags: ["performance","refactor","systems"],
  },
  {
    id: 491, repo: "void://web/renderer", title: "fix: eliminate layout thrash in virtualized scroll — 60fps on 100k rows",
    score: 9.8, reviews: 5, merged: "5 days ago", lang: "TypeScript",
    lines: { added: 178, removed: 203 },
    feedback: ["Impressive. Didn't think this was fixable without a rewrite.", "Batch reads before writes — exactly right."],
    tags: ["performance","browser","fix"],
  },
  {
    id: 477, repo: "void://auth/tokens", title: "feat: constant-time HMAC comparison to prevent timing attacks",
    score: 9.7, reviews: 7, merged: "8 days ago", lang: "Go",
    lines: { added: 44, removed: 31 },
    feedback: ["Security-critical fix, correctly implemented.", "The test suite for timing variance is excellent."],
    tags: ["security","cryptography"],
  },
  {
    id: 463, repo: "void://ml/inference", title: "perf: fused attention kernel — 2.3x throughput on A100",
    score: 9.6, reviews: 4, merged: "12 days ago", lang: "CUDA/Python",
    lines: { added: 891, removed: 244 },
    feedback: ["Numerical stability analysis is thorough.", "The tiling strategy is non-obvious but correct."],
    tags: ["ml","performance","cuda"],
  },
  {
    id: 448, repo: "void://db/query", title: "feat: adaptive query planner with runtime statistics feedback",
    score: 9.5, reviews: 8, merged: "14 days ago", lang: "C++",
    lines: { added: 1203, removed: 567 },
    feedback: ["This is production-grade work.", "Cardinality estimation is much more accurate than the naive approach."],
    tags: ["database","planner"],
  },
  {
    id: 432, repo: "void://core/parser", title: "fix: handle deeply nested AST without stack overflow — iterative DFS",
    score: 9.4, reviews: 5, merged: "18 days ago", lang: "Rust",
    lines: { added: 221, removed: 198 },
    feedback: ["Clean conversion from recursive to iterative.", "Good use of an explicit work stack."],
    tags: ["compiler","fix","recursion"],
  },
];

const LANG_COLOR: Record<string, string> = {
  "Rust": "#f74c00", "TypeScript": "#3178c6", "Go": "#00add8",
  "CUDA/Python": "#76b900", "C++": "#00599c", "Python": "#3572a5",
};

type SortKey = "score" | "reviews" | "merged";

export default function ShowcasePage() {
  const [sort, setSort] = useState<SortKey>("score");
  const [selected, setSelected] = useState<number | null>(null);
  const [langFilter, setLangFilter] = useState<string>("all");

  const langs = ["all", ...Array.from(new Set(SHOWCASED.map((p) => p.lang)))];
  const filtered = SHOWCASED
    .filter((p) => langFilter === "all" || p.lang === langFilter)
    .sort((a, b) => {
      if (sort === "score")   return b.score - a.score;
      if (sort === "reviews") return b.reviews - a.reviews;
      return 0;
    });

  const selectedPR = SHOWCASED.find((p) => p.id === selected);

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "3rem 2rem 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="s-tag">Showcase</div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              Great code.<br />No names attached.
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, maxWidth: 520 }}>
              The highest-scored anonymous PRs from the last 30 days. Author identity permanently unknown. Code quality permanently on record.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {langs.map((l) => (
                <button key={l} onClick={() => setLangFilter(l)}
                  style={{ padding: "0.35rem 0.875rem", border: `1px solid ${langFilter === l ? "var(--ghost)" : "var(--border)"}`, background: langFilter === l ? "rgba(167,139,250,0.1)" : "transparent", color: langFilter === l ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.65rem", transition: "all 0.15s" }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.08em" }}>sort:</span>
              {(["score","reviews"] as SortKey[]).map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  style={{ padding: "0.35rem 0.75rem", border: `1px solid ${sort === s ? "var(--ghost)" : "var(--border)"}`, background: sort === s ? "rgba(167,139,250,0.1)" : "transparent", color: sort === s ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.63rem", transition: "all 0.15s" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* PR list */}
          <div style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 80px 70px 80px", padding: "0.5rem 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span>#</span><span>Pull Request</span><span>Score</span><span>Reviews</span><span>Merged</span>
            </div>

            {filtered.map((pr) => (
              <div key={pr.id}
                onClick={() => setSelected(selected === pr.id ? null : pr.id)}
                style={{ display: "grid", gridTemplateColumns: "50px 1fr 80px 70px 80px", padding: "1rem 1.25rem", borderBottom: "1px solid rgba(167,139,250,0.05)", cursor: "pointer", background: selected === pr.id ? "rgba(167,139,250,0.04)" : "transparent", transition: "background 0.15s" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>#{pr.id}</span>
                <div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text)", marginBottom: "0.4rem", lineHeight: 1.4 }}>{pr.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.63rem", color: "var(--muted)" }}>{pr.repo}</span>
                    <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.5rem", background: `${LANG_COLOR[pr.lang] || "var(--muted)"}22`, color: LANG_COLOR[pr.lang] || "var(--muted)", border: `1px solid ${LANG_COLOR[pr.lang] || "var(--muted)"}44` }}>{pr.lang}</span>
                    {pr.tags.map((t) => (
                      <span key={t} style={{ fontSize: "0.6rem", color: "var(--muted)", opacity: 0.6 }}>#{t}</span>
                    ))}
                  </div>
                </div>
                <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: "0.82rem" }}>{pr.score}</span>
                <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>{pr.reviews}</span>
                <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>{pr.merged}</span>
              </div>
            ))}
          </div>

          {/* Selected PR detail */}
          {selectedPR && (
            <div style={{ marginTop: "1.5rem", border: "1px solid var(--border)", background: "var(--bg2)", padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.63rem", color: "var(--muted)", marginBottom: "0.4rem" }}>{selectedPR.repo} · #{selectedPR.id}</div>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{selectedPR.title}</h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", flexShrink: 0 }}>
                  <div style={{ textAlign: "center", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: "var(--display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ghost)" }}>{selectedPR.score}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase" }}>score</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: "var(--display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--teal)" }}>{selectedPR.reviews}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase" }}>reviews</div>
                  </div>
                </div>
              </div>

              {/* Diff stats */}
              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--green)" }}>+{selectedPR.lines.added} lines</span>
                <span style={{ fontSize: "0.72rem", color: "var(--red, #f87171)" }}>−{selectedPR.lines.removed} lines</span>
                <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>author: anonymous</span>
              </div>

              {/* Blind feedback */}
              <div>
                <div style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Blind reviewer feedback</div>
                {selectedPR.feedback.map((fb, i) => (
                  <div key={i} style={{ padding: "0.875rem 1rem", background: "var(--bg)", border: "1px solid var(--border)", borderLeft: "2px solid var(--ghost2)", marginBottom: "0.5rem", fontSize: "0.78rem", color: "var(--text)", fontStyle: "italic", lineHeight: 1.7 }}>
                    "{fb}"
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", border: "1px solid var(--border)", background: "var(--bg2)", fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.8 }}>
            <span style={{ color: "var(--ghost)" }}>// </span>
            All PRs shown here were reviewed and merged anonymously. Author identity is cryptographically protected and cannot be recovered from public data.
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
