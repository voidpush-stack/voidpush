"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const PLANS = [
  {
    name: "Team",
    price: "$49",
    period: "/mo",
    desc: "For small teams who want anonymous code review.",
    features: [
      "Up to 10 anonymous contributors",
      "Shared void:// namespace",
      "Team leaderboard (anonymous)",
      "Priority relay routing",
      "72h → 168h identity TTL",
      "Email support",
    ],
    cta: "Start team trial",
    highlight: false,
  },
  {
    name: "Org",
    price: "$199",
    period: "/mo",
    desc: "For engineering orgs that take bias-free review seriously.",
    features: [
      "Unlimited anonymous contributors",
      "Private org relay node",
      "Cross-team anonymous review pools",
      "ZK-verified contributor reputation",
      "CI/CD integration (headless mode)",
      "Audit log export",
      "SSO (SAML/OIDC)",
      "Dedicated support",
    ],
    cta: "Contact sales",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "On-premise deployment with full data sovereignty.",
    features: [
      "Self-hosted relay network",
      "Air-gapped deployment option",
      "Custom retention policies",
      "SLA 99.9% uptime guarantee",
      "Security audit support",
      "Custom ZK proof verification",
      "Dedicated customer success",
      "MSA + DPA available",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

const USE_CASES = [
  {
    icon: "🎯",
    title: "Hiring assessments",
    desc: "Evaluate candidates on code quality alone. No name, no university, no GitHub follower count. Just the code.",
  },
  {
    icon: "🔄",
    title: "Internal code review",
    desc: "Senior engineers' code gets the same scrutiny as juniors'. Seniority bias eliminated by design.",
  },
  {
    icon: "🌍",
    title: "Distributed teams",
    desc: "Teams across time zones and cultures review each other's code without social friction or hierarchy.",
  },
  {
    icon: "📋",
    title: "Compliance audits",
    desc: "Cryptographic audit logs prove code was reviewed fairly — without exposing reviewer identities.",
  },
];

export default function OrgPage() {
  const [billingAnnual, setBillingAnnual] = useState(false);

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "4rem 2rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
            <div className="s-tag" style={{ justifyContent: "center" }}>Org Mode</div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "1.25rem" }}>
              Anonymous review<br /><span style={{ color: "var(--ghost)" }}>for your whole team.</span>
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.8, marginBottom: "2rem" }}>
              VoidPush Org creates a private anonymous review pool for your engineering team. Code is judged on merit. Hierarchy disappears. Quality improves.
            </p>

            {/* Billing toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.875rem", marginBottom: "3rem" }}>
              <span style={{ fontSize: "0.75rem", color: billingAnnual ? "var(--muted)" : "var(--text)" }}>Monthly</span>
              <button
                onClick={() => setBillingAnnual(!billingAnnual)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: billingAnnual ? "var(--ghost)" : "var(--bg3)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  padding: 0,
                }}>
                <span style={{
                  position: "absolute", top: 3,
                  left: billingAnnual ? 22 : 3,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "var(--text)",
                  transition: "left 0.2s",
                  display: "block",
                }} />
              </button>
              <span style={{ fontSize: "0.75rem", color: billingAnnual ? "var(--text)" : "var(--muted)" }}>
                Annual <span style={{ color: "var(--green)", fontSize: "0.65rem" }}>save 20%</span>
              </span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>
          {/* Pricing cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", marginBottom: "4rem" }}>
            {PLANS.map((plan) => (
              <div key={plan.name}
                style={{
                  padding: "2rem",
                  background: plan.highlight ? "rgba(167,139,250,0.05)" : "var(--bg2)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,var(--ghost2),var(--ghost))" }} />
                )}
                {plan.highlight && (
                  <div style={{ position: "absolute", top: "1rem", right: "1rem", fontSize: "0.6rem", padding: "0.2rem 0.6rem", background: "var(--ghost)", color: "var(--bg)", letterSpacing: "0.1em" }}>
                    POPULAR
                  </div>
                )}

                <div style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{plan.name}</div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <span style={{ fontFamily: "var(--display)", fontSize: "2.5rem", fontWeight: 800, color: "var(--ghost)", letterSpacing: "-0.04em" }}>
                    {plan.price === "Custom" ? plan.price : billingAnnual ? `$${Math.round(parseInt(plan.price.slice(1)) * 0.8)}` : plan.price}
                  </span>
                  {plan.period && <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{plan.period}{billingAnnual ? "/yr billed" : ""}</span>}
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>{plan.desc}</p>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem", flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: "0.6rem", fontSize: "0.75rem", color: "var(--text)" }}>
                      <span style={{ color: "var(--green)", flexShrink: 0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/waitlist?plan=${plan.name.toLowerCase()}`}
                  style={{
                    padding: "0.75rem",
                    background: plan.highlight ? "var(--ghost)" : "transparent",
                    border: `1px solid ${plan.highlight ? "var(--ghost)" : "var(--border)"}`,
                    color: plan.highlight ? "var(--bg)" : "var(--muted)",
                    fontFamily: "var(--sans)", fontSize: "0.86rem", fontWeight: 800,
                    cursor: "pointer", transition: "all 0.2s",
                    width: "100%", textDecoration: "none", textAlign: "center", borderRadius: 999,
                  }}
                  onMouseEnter={(e) => { if (!plan.highlight) { e.currentTarget.style.borderColor = "var(--ghost)"; e.currentTarget.style.color = "var(--ghost)"; }}}
                  onMouseLeave={(e) => { if (!plan.highlight) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Use cases */}
          <div style={{ marginBottom: "4rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div className="s-tag" style={{ justifyContent: "center" }}>Use cases</div>
              <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(1.75rem,3vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                Where org mode makes a difference.
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)" }}>
              {USE_CASES.map((uc) => (
                <div key={uc.title}
                  style={{ padding: "2rem", background: "var(--bg2)", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg2)")}>
                  <div style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>{uc.icon}</div>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{uc.title}</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.8 }}>{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", padding: "3rem", border: "1px solid var(--border)", background: "var(--bg2)" }}>
            <h2 style={{ fontFamily: "var(--display)", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              Ready to remove bias from your code review?
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>
              Set up in 10 minutes. No credit card required for trial.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/waitlist" style={{ padding: "0.875rem 2rem", background: "var(--ghost)", color: "var(--bg)", border: "none", fontFamily: "var(--sans)", fontSize: "0.9rem", fontWeight: 800, textDecoration: "none", borderRadius: 999 }}>
                Start free trial
              </Link>
              <a href="mailto:sales@voidpush.dev?subject=VoidPush%20org%20demo" style={{ padding: "0.875rem 2rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--border)", fontFamily: "var(--sans)", fontSize: "0.9rem", fontWeight: 800, textDecoration: "none", borderRadius: 999 }}>
                Talk to sales
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <style>{`@media(max-width:768px){ .pricing-grid { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
