"use client";

import { useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const FACTS = [
  { label: "Founded",       val: "2026" },
  { label: "Stage",         val: "Private Beta" },
  { label: "Active ghosts", val: "2,847" },
  { label: "Anon commits",  val: "14,203" },
  { label: "Relay nodes",   val: "9 (7 countries)" },
  { label: "Anonymity rate",val: "98.4%" },
  { label: "Avg score",     val: "8.3 / 10" },
  { label: "License",       val: "MIT" },
];

const COLORS = [
  { name: "Ghost Purple", hex: "#a78bfa", var: "--ghost",  on: "dark" },
  { name: "Ghost Dark",   hex: "#7c3aed", var: "--ghost2", on: "dark" },
  { name: "Teal",         hex: "#2dd4bf", var: "--teal",   on: "dark" },
  { name: "Background",   hex: "#080b10", var: "--bg",     on: "light" },
  { name: "Surface",      hex: "#0d1117", var: "--bg2",    on: "light" },
  { name: "Text",         hex: "#e2e8f0", var: "--text",   on: "dark" },
  { name: "Muted",        hex: "#64748b", var: "--muted",  on: "dark" },
];

const QUOTES = [
  { text: "VoidPush is what happens when you take the human bias out of code review.", attr: "— unnamed ghost, top 10 contributor" },
  { text: "The best code I ever shipped was under a void ID. That says everything.", attr: "— void_3c7e, Q: 9.8" },
  { text: "We're not hiding. We're removing noise.", attr: "— VoidPush team" },
];

const DOWNLOADS = [
  { label: "Logo (SVG)", sub: "All variants — light, dark, monochrome", size: "12KB" },
  { label: "Logo (PNG)", sub: "1x, 2x, 4x — transparent background",   size: "48KB" },
  { label: "Brand guidelines (PDF)", sub: "Colors, typography, usage",  size: "2.1MB" },
  { label: "One-pager (PDF)", sub: "Company overview, one page",        size: "340KB" },
  { label: "Media kit (ZIP)", sub: "All assets bundled",                size: "4.8MB" },
];

export default function PressPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "3rem 2rem 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="s-tag">Press Kit</div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              Press &amp; media resources.
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, maxWidth: 520 }}>
              Brand assets, company facts, quotes, and contact info for journalists and content creators. Everything you need to write about VoidPush.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <a href="mailto:press@voidpush.dev"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--ghost)", color: "var(--ghost)", padding: "0.6rem 1.25rem", textDecoration: "none", fontSize: "0.78rem", fontFamily: "var(--mono)", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ghost)"; e.currentTarget.style.color = "var(--bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ghost)"; }}>
                press@voidpush.dev →
              </a>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>

            {/* Left column */}
            <div>
              {/* Company facts */}
              <h2 style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", letterSpacing: "-0.02em" }}>Company facts</h2>
              <div style={{ border: "1px solid var(--border)", marginBottom: "2.5rem" }}>
                {FACTS.map(({ label, val }, i) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: i < FACTS.length - 1 ? "1px solid rgba(167,139,250,0.06)" : "none", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--muted)" }}>{label}</span>
                    <span style={{ color: "var(--text)", fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Boilerplate */}
              <h2 style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", letterSpacing: "-0.02em" }}>Boilerplate</h2>
              <div style={{ border: "1px solid var(--border)", background: "var(--bg2)", padding: "1.25rem", marginBottom: "0.75rem", position: "relative" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.8 }}>
                  VoidPush is an anonymous code contribution network that strips author identity from git commits and routes pushes through a multi-hop relay network. Code is reviewed blind — judged on quality alone, not on who wrote it. Built on open protocols with cryptographic anonymity guarantees.
                </p>
                <button onClick={() => copy("VoidPush is an anonymous code contribution network that strips author identity from git commits and routes pushes through a multi-hop relay network. Code is reviewed blind — judged on quality alone, not on who wrote it. Built on open protocols with cryptographic anonymity guarantees.", "boilerplate")}
                  style={{ position: "absolute", top: "0.75rem", right: "0.75rem", padding: "0.3rem 0.6rem", background: "transparent", border: "1px solid var(--border)", color: copied === "boilerplate" ? "var(--green)" : "var(--muted)", fontFamily: "var(--mono)", fontSize: "0.6rem", cursor: "pointer" }}>
                  {copied === "boilerplate" ? "✓ copied" : "copy"}
                </button>
              </div>

              {/* Quotes */}
              <h2 style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, margin: "2.5rem 0 1rem", letterSpacing: "-0.02em" }}>Quotes</h2>
              {QUOTES.map((q, i) => (
                <div key={i} style={{ padding: "1.25rem", border: "1px solid var(--border)", borderLeft: "2px solid var(--ghost2)", background: "var(--bg2)", marginBottom: "0.75rem", position: "relative" }}>
                  <p style={{ fontSize: "0.82rem", color: "var(--text)", lineHeight: 1.8, fontStyle: "italic", marginBottom: "0.5rem" }}>"{q.text}"</p>
                  <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{q.attr}</span>
                  <button onClick={() => copy(`"${q.text}" ${q.attr}`, `q-${i}`)}
                    style={{ position: "absolute", top: "0.75rem", right: "0.75rem", padding: "0.3rem 0.6rem", background: "transparent", border: "1px solid var(--border)", color: copied === `q-${i}` ? "var(--green)" : "var(--muted)", fontFamily: "var(--mono)", fontSize: "0.6rem", cursor: "pointer" }}>
                    {copied === `q-${i}` ? "✓" : "copy"}
                  </button>
                </div>
              ))}
            </div>

            {/* Right column */}
            <div>
              {/* Logo preview */}
              <h2 style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", letterSpacing: "-0.02em" }}>Logo</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)", marginBottom: "2.5rem" }}>
                {[
                  { bg: "var(--bg)", label: "Dark" },
                  { bg: "#f8f9fc", label: "Light" },
                ].map(({ bg, label }) => (
                  <div key={label} style={{ background: bg, padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <GhostSVG color={label === "Light" ? "#7c3aed" : "#a78bfa"} />
                      <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: label === "Light" ? "#0f172a" : "#e2e8f0", letterSpacing: "-0.02em" }}>VoidPush</span>
                    </div>
                    <span style={{ fontSize: "0.6rem", color: label === "Light" ? "#64748b" : "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Brand colors */}
              <h2 style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", letterSpacing: "-0.02em" }}>Brand colors</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "2.5rem" }}>
                {COLORS.map(({ name, hex, on }) => (
                  <div key={hex} style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{ width: 36, height: 36, background: hex, flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text)", fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: "0.63rem", color: "var(--muted)" }}>{hex}</div>
                    </div>
                    <button onClick={() => copy(hex, hex)}
                      style={{ padding: "0.25rem 0.5rem", background: "transparent", border: "1px solid var(--border)", color: copied === hex ? "var(--green)" : "var(--muted)", fontFamily: "var(--mono)", fontSize: "0.58rem", cursor: "pointer" }}>
                      {copied === hex ? "✓" : "copy"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Downloads */}
              <h2 style={{ fontFamily: "var(--display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", letterSpacing: "-0.02em" }}>Downloads</h2>
              <div style={{ border: "1px solid var(--border)" }}>
                {DOWNLOADS.map(({ label, sub, size }, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", padding: "0.875rem 1rem", borderBottom: i < DOWNLOADS.length - 1 ? "1px solid rgba(167,139,250,0.06)" : "none", gap: "1rem", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text)" }}>{label}</div>
                      <div style={{ fontSize: "0.63rem", color: "var(--muted)", marginTop: "0.15rem" }}>{sub}</div>
                    </div>
                    <span style={{ fontSize: "0.63rem", color: "var(--muted)" }}>{size}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--ghost)" }}>↓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function GhostSVG({ color }: { color: string }) {
  return (
    <svg width="24" height="28" viewBox="0 0 24 28" fill={color}>
      <path d="M12 0C5.373 0 0 5.373 0 12v16l4-4 4 4 4-4 4 4 4-4V12C24 5.373 18.627 0 12 0z" />
    </svg>
  );
}
