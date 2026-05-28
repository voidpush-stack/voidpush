"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "2rem 3rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        zIndex: 1,
        fontSize: "0.63rem",
        color: "var(--muted)",
      }}
    >
      <span>
        👻 VoidPush · v0.1.0-alpha ·{" "}
        <span style={{ color: "var(--ghost)" }}>anonymous by default</span>
      </span>
      <span style={{ display: "flex", gap: "1rem" }}>
        {["github", "docs", "relays", "x/twitter"].map((link) => (
          <Link key={link} href="#" className="footer-link">{link}</Link>
        ))}
      </span>
      <span style={{ opacity: 0.35 }}>built in the dark</span>
    </footer>
  );
}
