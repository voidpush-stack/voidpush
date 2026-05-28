"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ghost-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("ghost-theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setDark(!dark)}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        color: "var(--muted)",
        padding: "0.4rem 0.75rem",
        fontFamily: "var(--mono)",
        fontSize: "0.65rem",
        cursor: "pointer",
        letterSpacing: "0.08em",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ghost)"; e.currentTarget.style.color = "var(--ghost)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
    >
      {dark ? "◑ light" : "● dark"}
    </button>
  );
}
