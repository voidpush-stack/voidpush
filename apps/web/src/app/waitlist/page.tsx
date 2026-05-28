"use client";

import { useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const STATS = [
  { val: "2,847", label: "active contributors" },
  { val: "14.2k", label: "anon commits" },
  { val: "847",   label: "waitlist spots left" },
  { val: "72h",   label: "avg wait time" },
];

const PERKS = [
  { icon: "👻", title: "Early void status",    desc: "First 1,000 users get a permanent ghost_XXXX short ID — never available again." },
  { icon: "🔑", title: "Extended TTL",          desc: "Beta users get 168h identity TTL (7 days) vs the standard 72h." },
  { icon: "⚡", title: "Priority relay routing", desc: "Your pushes are routed through core relays first — lowest latency, highest trust." },
  { icon: "🗳️", title: "Protocol governance",   desc: "Vote on protocol changes and relay federation standards before they go public." },
];

type Step = "email" | "submitted" | "verified";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [step, setStep]   = useState<Step>("email");
  const [error, setError] = useState("");
  const [refCode]         = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    // TODO: POST to /api/waitlist
    setStep("submitted");
  }

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "4rem 2rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border)", padding: "0.35rem 1rem", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ghost)", marginBottom: "2rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite", display: "inline-block" }} />
              beta access · limited spots
            </div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(2.5rem,6vw,4rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "1.5rem" }}>
              Become a ghost<br /><span style={{ color: "var(--ghost)" }}>before everyone else.</span>
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.8, marginBottom: "2.5rem" }}>
              VoidPush is in private beta. Join the waitlist to get early access — anonymity not required to sign up, but guaranteed once you're in.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", justifyContent: "center", gap: "2.5rem", marginBottom: "3rem", flexWrap: "wrap" }}>
              {STATS.map(({ val, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--ghost)", lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "0.25rem" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Form */}
            {step === "email" && (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0", width: "100%", maxWidth: 480 }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ flex: 1, padding: "0.875rem 1.25rem", background: "var(--bg)", border: "1px solid var(--border)", borderRight: "none", color: "var(--text)", fontFamily: "var(--mono)", fontSize: "0.82rem", outline: "none" }}
                  />
                  <button type="submit"
                    style={{ padding: "0.875rem 1.5rem", background: "var(--ghost)", color: "var(--bg)", border: "none", fontFamily: "var(--mono)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em", whiteSpace: "nowrap", transition: "background 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#c4b5fd")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--ghost)")}>
                    join waitlist →
                  </button>
                </div>
                {error && <span style={{ fontSize: "0.72rem", color: "var(--red, #f87171)" }}>{error}</span>}
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", opacity: 0.6 }}>
                  No spam. No tracking. Just a heads-up when you&apos;re in.
                </span>
              </form>
            )}

            {step === "submitted" && (
              <div style={{ border: "1px solid var(--border)", padding: "2rem", background: "var(--bg)", maxWidth: 480, margin: "0 auto" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>👻</div>
                <div style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  You&apos;re on the list.
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "1.25rem" }}>
                  We&apos;ll email you when your spot is ready. Move up the queue by sharing your referral link.
                </p>
                <div style={{ padding: "0.75rem 1rem", background: "var(--bg2)", border: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--teal)", marginBottom: "0.75rem", wordBreak: "break-all" }}>
                  https://voidpush.dev/waitlist?ref={refCode}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`https://voidpush.dev/waitlist?ref=${refCode}`)}
                  style={{ padding: "0.5rem 1.25rem", background: "transparent", border: "1px solid var(--ghost)", color: "var(--ghost)", fontFamily: "var(--mono)", fontSize: "0.72rem", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ghost)"; e.currentTarget.style.color = "var(--bg)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ghost)"; }}>
                  copy referral link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Perks */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="s-tag" style={{ justifyContent: "center" }}>Beta perks</div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(1.75rem,3vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Early ghosts get more.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)" }}>
            {PERKS.map((perk) => (
              <div key={perk.title} style={{ padding: "2rem", background: "var(--bg2)", transition: "background 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg2)")}>
                <div style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>{perk.icon}</div>
                <h3 style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{perk.title}</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.8 }}>{perk.desc}</p>
              </div>
            ))}
          </div>

          {/* Invite-only section */}
          <div style={{ marginTop: "3rem", padding: "2rem", border: "1px solid var(--border)", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Have an invite code?
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.7 }}>
                Existing ghosts can invite others directly. Bypass the waitlist instantly.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="VOID-XXXXXXXX"
                style={{ padding: "0.75rem 1rem", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--mono)", fontSize: "0.78rem", outline: "none", width: 200, textTransform: "uppercase", letterSpacing: "0.1em" }}
              />
              <button
                style={{ padding: "0.75rem 1.25rem", background: "var(--teal)", color: "var(--bg)", border: "none", fontFamily: "var(--mono)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em", transition: "all 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                redeem →
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <style>{`
        input::placeholder { color: var(--muted); opacity: 0.5; }
        input:focus { border-color: var(--ghost) !important; }
        @media(max-width:600px){
          form > div { flex-direction: column !important; }
          form > div input { border-right: 1px solid var(--border) !important; border-bottom: none !important; }
        }
      `}</style>
    </>
  );
}
