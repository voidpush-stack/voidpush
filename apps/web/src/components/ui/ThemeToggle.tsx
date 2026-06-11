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

  if (!mounted) return <span className="theme-toggle theme-toggle--placeholder" aria-hidden="true" />;

  return (
    <button
      className="theme-toggle"
      onClick={() => setDark(!dark)}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb" data-dark={dark ? "true" : "false"} />
      </span>
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
