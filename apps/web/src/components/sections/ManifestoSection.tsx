"use client";

const LINES = [
  { text: "Your code has no face.",             color: "var(--text)" },
  { text: "Your ideas have no gender.",         color: "var(--ghost)" },
  { text: "Your commits have no country.",      color: "#475569" },
  { text: "Your PR has no alma mater.",         color: "var(--teal)" },
  { text: "No follower count. No star graph.",  color: "#475569" },
  { text: "Just the diff. Just the signal.",    color: "var(--text)" },
  { text: "Code is the only credential that matters.", color: "var(--ghost)" },
];

export function ManifestoSection() {
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "5rem 2rem", borderTop: "1px solid var(--border2)", borderBottom: "1px solid var(--border2)", background: "var(--bg2)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ fontSize: "0.63rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ghost)", marginBottom: "2rem", opacity: 0.7 }}>
          // manifesto
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {LINES.map((line, i) => (
            <div key={i} className="manifesto-line" style={{ color: line.color }}>
              {line.text}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .manifesto-line {
          font-family: var(--display); font-size: clamp(1.6rem,3.5vw,2.8rem);
          font-weight: 800; letter-spacing: -.03em; line-height: 1.1;
          padding: .5rem 0; border-bottom: 1px solid var(--border2);
          cursor: default; transition: color 0.3s;
        }
        .manifesto-line:hover { color: var(--text) !important; }
      `}</style>
    </div>
  );
}
