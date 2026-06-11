"use client";

import { ProtocolScene3D } from "@/components/ui/ProtocolScene3D";

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
    <section id="how" className="protocol-section">
      <div className="protocol-intro">
        <div className="protocol-copy">
          <div className="s-tag">Protocol</div>
          <h2 className="protocol-title reveal">Anonymous push.<br />Accountable code.</h2>
          <p className="s-desc reveal">Three steps between you and total anonymity. Your code gets judged. You don&apos;t.</p>
        </div>
        <div className="protocol-object reveal">
          <ProtocolScene3D />
        </div>
      </div>

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
    </section>
  );
}
