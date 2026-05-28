"use client";

const STEPS = [
  {
    num: "01 / init", icon: "👻", title: "Become Anonymous",
    desc: "A keypair is generated locally. No email, no OAuth, no handle. Your identity is a temporary hash — cryptographically signed, socially invisible. Expires in 72h.",
    code: ["$ void init", "> identity: void_7f3a2b9c", "> ttl: 72h · ephemeral", "> stored: local only"],
  },
  {
    num: "02 / push", icon: "🔀", title: "Push Through Relays",
    desc: "Commits are stripped of all author metadata and routed through a multi-hop relay network before reaching the target repo. No IP fingerprinting. No history trail.",
    code: ["$ void push origin main", "> relay chain: 3 hops", "> metadata: stripped", "> author: ghost_7f3a"],
  },
  {
    num: "03 / score", icon: "⚡", title: "Earn Pure Signal",
    desc: "Reviewers rate code quality blind. No name, no profile, no star count. Your reputation is built entirely on what you ship — linked across sessions via ZK proof.",
    code: ["> review score: 9.4 / 10", "> rank: #3 globally", "> identity: unknown"],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" style={{ position: "relative", zIndex: 1, padding: "6rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
      <div className="s-tag">Protocol</div>
      <h2 className="s-title reveal">Zero identity.<br />Full accountability.</h2>
      <p className="s-desc reveal">Three steps between you and total anonymity. Your code gets judged. You don&apos;t.</p>

      <div className="steps-grid">
        {STEPS.map((step) => (
          <div key={step.num} className="step-card reveal">
            <div className="step-bar" />
            <div style={{ fontSize: "0.63rem", color: "var(--ghost)", letterSpacing: "0.15em", marginBottom: "1.5rem", opacity: 0.6 }}>{step.num}</div>
            <div style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>{step.icon}</div>
            <h3 style={{ fontFamily: "var(--display)", fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.75rem" }}>{step.title}</h3>
            <p style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.9 }}>{step.desc}</p>
            <div className="step-code">
              {step.code.map((line, i) => (
                <span key={i} style={{ display: "block", color: line.startsWith("$") ? "var(--muted)" : "var(--teal)" }}>{line}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 2px; margin-top: 4rem; }
        @media(max-width:768px){ .steps-grid { grid-template-columns: 1fr; } }
        .step-card { padding: 2.5rem 2rem; border: 1px solid var(--border); background: var(--bg2); position: relative; overflow: hidden; transition: all 0.3s; }
        .step-card:hover { border-color: rgba(167,139,250,.4); background: var(--bg3); }
        .step-card:hover .step-bar { transform: scaleX(1); }
        .step-bar { position: absolute; top:0; left:0; right:0; height:2px; background: linear-gradient(90deg,var(--ghost2),var(--ghost)); transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease; }
        .step-code { margin-top:1.25rem; padding:.75rem; background:var(--bg); border-left:2px solid var(--ghost2); font-size:.63rem; color:var(--muted); line-height:1.9; }
      `}</style>
    </section>
  );
}
