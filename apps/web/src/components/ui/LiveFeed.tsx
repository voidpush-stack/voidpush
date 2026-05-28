"use client";

import { useState, useEffect } from "react";

const FEED_DATA = [
  { id: "ghost_7f3a", action: "pushed 3 commits to",   target: "core/parser",  type: "repo", score: "8.9" },
  { id: "void_b91d", action: "merged PR #492 into",    target: "main",         type: "mg",   score: "9.7" },
  { id: "void_3c7e", action: "opened pull request on", target: "auth/token",   type: "pr",   score: "7.2" },
  { id: "void_a40f", action: "scored 9.4 reviewing",   target: "api/routes",   type: "repo", score: "9.4" },
  { id: "void_22b8", action: "closed issue #108 in",   target: "cache/layer",  type: "mg",   score: "8.1" },
  { id: "void_d91c", action: "pushed hotfix to",       target: "db/migrate",   type: "repo", score: "9.9" },
  { id: "void_f55a", action: "opened PR #503 against", target: "infra/deploy", type: "pr",   score: "8.6" },
  { id: "void_09e2", action: "merged 12 commits into", target: "release/v2",   type: "mg",   score: "9.1" },
];

const TIMES = ["2s ago","14s ago","31s ago","47s ago","1m ago","2m ago","3m ago","5m ago"];

const TARGET_COLOR: Record<string, string> = {
  mg:   "var(--green)",
  pr:   "var(--yellow)",
  repo: "var(--teal)",
};

function fmt(n: number) {
  // Always use en-US to match server rendering
  return n.toLocaleString("en-US");
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function LiveFeed() {
  const [ghostCount, setGhostCount] = useState(2847);
  const [feed, setFeed] = useState(FEED_DATA);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFeed(shuffle(FEED_DATA));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setFeed(shuffle(FEED_DATA));
      setGhostCount((n) => n + Math.floor(Math.random() * 4) - 1);
    }, 7000);
    return () => clearInterval(interval);
  }, [mounted]);

  const stats = [
    { val: fmt(ghostCount), label: "Active Contributors" },
    { val: "14.2k",         label: "Anon Commits"  },
    { val: "98.4%",         label: "Anonymity Rate" },
    { val: "9",             label: "Active Relays"  },
  ];

  return (
    <section id="live" style={{ position:"relative", zIndex:1, padding:"0 2rem 6rem", maxWidth:1100, margin:"0 auto" }}>
      {/* Stats */}
      <div className="stats-grid">
        {stats.map(({ val, label }) => (
          <div key={label} style={{ padding:"2rem", background:"var(--bg2)", textAlign:"center" }}>
            <span suppressHydrationWarning style={{ fontFamily:"var(--display)", fontSize:"2.5rem", fontWeight:800, color:"var(--ghost)", letterSpacing:"-0.04em", lineHeight:1, display:"block", marginBottom:"0.5rem" }}>
              {val}
            </span>
            <span style={{ fontSize:"0.63rem", color:"var(--muted)", letterSpacing:"0.12em", textTransform:"uppercase" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div style={{ border:"1px solid var(--border)", borderTop:"none", background:"var(--bg2)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.5rem", borderBottom:"1px solid var(--border)" }}>
          <span style={{ fontSize:"0.68rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)" }}>
            network activity
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:"0.35rem", fontSize:"0.63rem", color:"var(--green)" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", animation:"pulse 2s infinite", display:"inline-block" }} />
            LIVE
          </span>
        </div>

        {feed.map((item, i) => (
          <div key={`${item.id}-${i}`} className="feed-row" style={{ animationDelay:`${i * 0.05}s` }}>
            <span style={{ color:"var(--ghost)", fontSize:"0.63rem", minWidth:90, opacity:0.75 }}>{item.id}</span>
            <span style={{ color:"var(--muted)", flex:1 }}>
              {item.action}{" "}
              <span style={{ color: TARGET_COLOR[item.type] }}>{item.target}</span>
            </span>
            <span style={{ fontSize:"0.63rem", padding:"0.2rem 0.6rem", background:"rgba(45,212,191,0.08)", color:"var(--teal)" }}>
              Q:{item.score}
            </span>
            <span style={{ color:"var(--muted)", fontSize:"0.63rem", minWidth:50, textAlign:"right", opacity:0.45 }}>
              {TIMES[i]}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border); border:1px solid var(--border); }
        @media(max-width:768px){ .stats-grid { grid-template-columns:repeat(2,1fr); } }
        .feed-row { display:flex; align-items:center; gap:1.5rem; padding:0.875rem 1.5rem; border-bottom:1px solid rgba(167,139,250,0.05); font-size:0.7rem; animation:revealRow 0.4s ease both; }
        .feed-row:hover { background:rgba(167,139,250,0.03); }
        @media(max-width:600px){ .feed-row { flex-wrap:wrap; gap:0.5rem; } }
      `}</style>
    </section>
  );
}
