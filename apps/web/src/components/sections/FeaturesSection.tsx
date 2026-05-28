"use client";

const FEATURES = [
  { icon: "🔑", title: "Ephemeral Keypairs",      desc: "Identity lives locally, expires after 72 hours, never transmitted in plaintext. No server stores your real identity. Ever." },
  { icon: "🌐", title: "Multi-hop Relay Network", desc: "Every push routes through 3–7 relay nodes across different jurisdictions. Timing attacks and traffic analysis both defeated by design." },
  { icon: "✂️", title: "Metadata Stripping",      desc: "Author name, email, timestamp, local paths — all scrubbed before your commit leaves your machine. Not after. Before." },
  { icon: "⭐", title: "Blind Code Review",        desc: "Reviewers see only the diff. No avatar, no contribution graph, no follower count. Merit-only scoring with cryptographic audit trail." },
  { icon: "🧮", title: "ZK Reputation",           desc: "Accumulate score across ephemeral sessions via zero-knowledge proof linking. Build cred without ever revealing who you are." },
  { icon: "🧰", title: "Standard Git Wrapper",    desc: "Works with your existing tools. void push instead of git push. Zero new workflow to learn." },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      style={{ position: "relative", zIndex: 1, padding: "6rem 2rem", maxWidth: 1100, margin: "0 auto" }}
    >
      <div className="s-tag">Features</div>
      <h2 className="s-title reveal">Built for<br />disappearing.</h2>
      <p className="s-desc reveal">Every feature designed around one principle — code speaks, identities don&apos;t.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1px", marginTop: "4rem", border: "1px solid var(--border)", background: "var(--border)" }}>
        {FEATURES.map((feat) => (
          <div key={feat.title} className="feat-card reveal">
            <div className="feat-icon">{feat.icon}</div>
            <h3 style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              {feat.title}
            </h3>
            <p style={{ fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.9 }}>{feat.desc}</p>
          </div>
        ))}
      </div>

      <style>{`
        .feat-card { padding: 2rem; background: var(--bg2); transition: background 0.3s; cursor: default; }
        .feat-card:hover { background: var(--bg3); }
        .feat-icon { width: 40px; height: 40px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-bottom: 1.25rem; color: var(--ghost); }
      `}</style>
    </section>
  );
}
