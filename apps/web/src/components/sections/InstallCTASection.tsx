"use client";

import { useState } from "react";
import Link from "next/link";

const INSTALL_CMD = "curl -fsSL https://voidpush.dev/install.sh | sh";

export function InstallCTASection() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      id="install"
      style={{
        textAlign: "center",
        padding: "8rem 2rem",
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Gradient line */}
      <div
        style={{
          position: "absolute",
          top: 0, left: "50%",
          transform: "translateX(-50%)",
          width: 400, height: 1,
          background: "linear-gradient(90deg,transparent,var(--ghost),transparent)",
        }}
      />

      <h2
        style={{
          fontFamily: "var(--display)",
          fontSize: "clamp(2.5rem,5vw,5rem)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 0.95,
          marginBottom: "1.5rem",
        }}
      >
        Enter the
        <br />
        <span style={{ color: "var(--ghost)" }}>void.</span>
      </h2>

      <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "2.5rem", lineHeight: 1.8 }}>
        One command. No account. Gone in 72 hours.
      </p>

      {/* Install command */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
        <button
          onClick={copy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "1rem",
            border: "1px solid var(--border)",
            padding: "0.875rem 1.5rem",
            background: "var(--bg2)",
            fontSize: "0.78rem",
            cursor: "pointer",
            transition: "border-color 0.2s",
            fontFamily: "var(--mono)",
            userSelect: "all",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ghost)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <span style={{ color: "var(--ghost)" }}>$</span>
          <span style={{ color: "var(--teal)" }}>{INSTALL_CMD}</span>
        </button>

        <span
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: copied ? "var(--green)" : "var(--muted)",
            opacity: copied ? 1 : 0.5,
            transition: "color 0.2s",
          }}
        >
          {copied ? "✓ copied!" : "click to copy"}
        </span>
      </div>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/docs"
          style={{
            background: "var(--ghost)",
            color: "var(--bg)",
            padding: "0.875rem 2rem",
            fontFamily: "var(--mono)",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textDecoration: "none",
            display: "inline-block",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#c4b5fd"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--ghost)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          → read the docs
        </Link>
        <Link
          href="https://github.com/voidpush/voidpush"
          style={{
            background: "transparent",
            color: "var(--muted)",
            border: "1px solid rgba(100,116,139,.3)",
            padding: "0.875rem 2rem",
            fontFamily: "var(--mono)",
            fontSize: "0.78rem",
            letterSpacing: "0.05em",
            textDecoration: "none",
            display: "inline-block",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--muted)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "rgba(100,116,139,.3)"; }}
        >
          ★ star on github
        </Link>
      </div>
    </div>
  );
}
