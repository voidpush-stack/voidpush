"use client";

import { useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const REPOS = [
  { url: "void://infra/loadbalancer",   name: "loadbalancer",   org: "infra",    lang: "Rust",       stars: 847,  commits: 1204, ghosts: 23, avgScore: 9.4, desc: "High-performance async load balancer with health checking and circuit breaking.", updated: "2h ago",   isPublic: true  },
  { url: "void://web/renderer",         name: "renderer",       org: "web",      lang: "TypeScript", stars: 612,  commits: 892,  ghosts: 17, avgScore: 9.1, desc: "Virtualized DOM renderer for 100k+ row lists without layout thrash.",             updated: "5h ago",   isPublic: true  },
  { url: "void://auth/tokens",          name: "tokens",         org: "auth",     lang: "Go",         stars: 531,  commits: 441,  ghosts: 11, avgScore: 9.7, desc: "Constant-time token authentication library with audit trail.",                    updated: "1d ago",   isPublic: true  },
  { url: "void://ml/inference",         name: "inference",      org: "ml",       lang: "Python",     stars: 1203, commits: 2341, ghosts: 38, avgScore: 9.3, desc: "Fast transformer inference with fused attention kernels and quantisation.",       updated: "1d ago",   isPublic: true  },
  { url: "void://db/query",             name: "query",          org: "db",       lang: "C++",        stars: 389,  commits: 1102, ghosts: 29, avgScore: 9.2, desc: "Adaptive query planner with runtime statistics feedback loop.",                   updated: "2d ago",   isPublic: true  },
  { url: "void://core/parser",          name: "parser",         org: "core",     lang: "Rust",       stars: 277,  commits: 631,  ghosts: 14, avgScore: 9.0, desc: "Recursive-descent parser with iterative DFS for deeply nested ASTs.",           updated: "3d ago",   isPublic: true  },
  { url: "void://crypto/primitives",    name: "primitives",     org: "crypto",   lang: "Rust",       stars: 441,  commits: 312,  ghosts: 9,  avgScore: 9.6, desc: "Zero-dependency cryptographic primitives. Ed25519, X25519, ChaCha20.",         updated: "4d ago",   isPublic: true  },
  { url: "void://devtools/profiler",    name: "profiler",       org: "devtools", lang: "C",          stars: 198,  commits: 488,  ghosts: 12, avgScore: 8.8, desc: "Sampling profiler with flame graph output. No instrumentation needed.",         updated: "5d ago",   isPublic: true  },
  { url: "void://network/quic",         name: "quic",           org: "network",  lang: "Rust",       stars: 562,  commits: 987,  ghosts: 21, avgScore: 9.2, desc: "QUIC protocol implementation with 0-RTT handshake and connection migration.",   updated: "6d ago",   isPublic: true  },
  { url: "void://ui/components",        name: "components",     org: "ui",       lang: "TypeScript", stars: 334,  commits: 743,  ghosts: 16, avgScore: 8.9, desc: "Accessible, unstyled component primitives. Zero runtime CSS-in-JS.",            updated: "1w ago",   isPublic: true  },
  { url: "void://cli/shell",            name: "shell",          org: "cli",      lang: "Go",         stars: 221,  commits: 384,  ghosts: 8,  avgScore: 8.7, desc: "Embeddable shell interpreter with POSIX compliance and plugin API.",            updated: "1w ago",   isPublic: true  },
  { url: "void://os/scheduler",         name: "scheduler",      org: "os",       lang: "C",          stars: 609,  commits: 1891, ghosts: 34, avgScore: 9.5, desc: "CFS-inspired task scheduler with deadline scheduling and real-time support.",   updated: "2w ago",   isPublic: true  },
];

const LANG_COLOR: Record<string, string> = {
  Rust: "#f74c00", TypeScript: "#3178c6", Go: "#00add8",
  Python: "#3572a5", "C++": "#00599c", C: "#555555",
};

const LANGS = ["all", ...Array.from(new Set(REPOS.map((r) => r.lang)))];

type SortKey = "stars" | "commits" | "ghosts" | "score" | "updated";

export default function ExplorePage() {
  const [search, setSearch]   = useState("");
  const [lang, setLang]       = useState("all");
  const [sort, setSort]       = useState<SortKey>("stars");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = REPOS
    .filter((r) =>
      (lang === "all" || r.lang === lang) &&
      (search === "" || r.name.includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase()) || r.org.includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === "stars")   return b.stars - a.stars;
      if (sort === "commits") return b.commits - a.commits;
      if (sort === "ghosts")  return b.ghosts - a.ghosts;
      if (sort === "score")   return b.avgScore - a.avgScore;
      return 0;
    });

  const sel = REPOS.find((r) => r.url === selected);

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "3rem 2rem 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="s-tag">Explorer</div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              Browse void:// repos.
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, maxWidth: 520 }}>
              Public repositories on the VoidPush network. All commits anonymous. All scores verified. No author profiles.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: "2rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
              {[
                { val: REPOS.length, label: "public repos" },
                { val: REPOS.reduce((s, r) => s + r.commits, 0).toLocaleString("en-US"), label: "total commits" },
                { val: REPOS.reduce((s, r) => s + r.ghosts, 0), label: "unique ghosts" },
                { val: (REPOS.reduce((s, r) => s + r.avgScore, 0) / REPOS.length).toFixed(1), label: "avg score" },
              ].map(({ val, label }) => (
                <div key={label} style={{ fontSize: "0.72rem" }}>
                  <span style={{ color: "var(--ghost)", fontWeight: 700, fontFamily: "var(--display)", fontSize: "1.1rem" }}>{val}</span>
                  <span style={{ color: "var(--muted)", marginLeft: "0.4rem" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
          {/* Search + filters */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search repos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: "0.6rem 1rem", background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--mono)", fontSize: "0.78rem", outline: "none" }}
            />
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {LANGS.map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ padding: "0.4rem 0.75rem", border: `1px solid ${lang === l ? "var(--ghost)" : "var(--border)"}`, background: lang === l ? "rgba(167,139,250,0.1)" : "transparent", color: lang === l ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.62rem", transition: "all 0.15s" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Sort row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.08em" }}>sort by:</span>
            {(["stars","commits","ghosts","score"] as SortKey[]).map((s) => (
              <button key={s} onClick={() => setSort(s)}
                style={{ padding: "0.25rem 0.6rem", border: `1px solid ${sort === s ? "var(--ghost)" : "var(--border)"}`, background: sort === s ? "rgba(167,139,250,0.1)" : "transparent", color: sort === s ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.6rem", transition: "all 0.15s" }}>
                {s}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: "0.63rem", color: "var(--muted)" }}>{filtered.length} repos</span>
          </div>

          {/* Repo grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", marginBottom: sel ? "1.5rem" : 0 }}>
            {filtered.map((repo) => (
              <div key={repo.url}
                onClick={() => setSelected(selected === repo.url ? null : repo.url)}
                style={{ padding: "1.5rem", background: selected === repo.url ? "rgba(167,139,250,0.05)" : "var(--bg2)", cursor: "pointer", transition: "background 0.15s", position: "relative" }}
                onMouseEnter={(e) => { if (selected !== repo.url) e.currentTarget.style.background = "var(--bg3)"; }}
                onMouseLeave={(e) => { if (selected !== repo.url) e.currentTarget.style.background = "var(--bg2)"; }}
              >
                {selected === repo.url && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,var(--ghost2),var(--ghost))" }} />
                )}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.6rem" }}>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.6 }}>{repo.org}/</span>
                    <span style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{repo.name}</span>
                  </div>
                  <span style={{ fontSize: "0.62rem", padding: "0.15rem 0.5rem", background: `${LANG_COLOR[repo.lang] || "var(--muted)"}22`, color: LANG_COLOR[repo.lang] || "var(--muted)", border: `1px solid ${LANG_COLOR[repo.lang] || "var(--muted)"}44`, flexShrink: 0 }}>{repo.lang}</span>
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.7, marginBottom: "1rem" }}>{repo.desc}</p>
                <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.63rem", color: "var(--muted)" }}>
                  <span>⭐ {repo.stars.toLocaleString("en-US")}</span>
                  <span>📝 {repo.commits.toLocaleString("en-US")} commits</span>
                  <span>👻 {repo.ghosts} ghosts</span>
                  <span style={{ color: "var(--teal)", marginLeft: "auto" }}>Q:{repo.avgScore}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected repo detail */}
          {sel && (
            <div style={{ border: "1px solid var(--border)", background: "var(--bg2)", padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.82rem", color: "var(--ghost)" }}>{sel.url}</span>
                <span style={{ fontSize: "0.63rem", color: "var(--muted)", marginLeft: "auto" }}>updated {sel.updated}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
                {[
                  { label: "Stars",    val: sel.stars.toLocaleString("en-US") },
                  { label: "Commits",  val: sel.commits.toLocaleString("en-US") },
                  { label: "Ghosts",   val: sel.ghosts },
                  { label: "Avg Score",val: sel.avgScore },
                ].map(({ label, val }) => (
                  <div key={label} style={{ padding: "0.875rem", background: "var(--bg)", border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ghost)" }}>{val}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.25rem" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => navigator.clipboard.writeText(`void clone ${sel.url}`)}
                  style={{ padding: "0.6rem 1.25rem", background: "var(--ghost)", color: "var(--bg)", border: "none", fontFamily: "var(--mono)", fontSize: "0.72rem", cursor: "pointer", fontWeight: 700 }}>
                  void clone {sel.url}
                </button>
                <span style={{ fontSize: "0.63rem", color: "var(--muted)", alignSelf: "center" }}>// click to copy</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <style>{`
        input::placeholder { color: var(--muted); opacity: 0.5; }
        input:focus { border-color: var(--ghost) !important; }
        @media(max-width:768px){
          .repo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
