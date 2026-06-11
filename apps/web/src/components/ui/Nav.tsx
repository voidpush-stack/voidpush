"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { label: "Explore", href: "/explore" },
  { label: "Showcase", href: "/showcase" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Network", href: "/network" },
  { label: "Blog", href: "/blog" },
  { label: "Docs", href: "/docs" },
  { label: "Org", href: "/org" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className={`site-nav ${scrolled ? "site-nav--scrolled" : ""}`}>
        <Link href="/" className="site-nav__brand">
          <VoidLogo />
          <span>VoidPush</span>
        </Link>

        <ul className="nav-links">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link href={href} className="nav-link">{label}</Link>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <ThemeToggle />
          <Link href="/dashboard" className="nav-link-secondary">Dashboard</Link>
          <Link href="/waitlist" className="nav-cta">Join beta</Link>
          <button
            className="hamburger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="mobile-drawer">
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} className="mobile-drawer__link">
              {label}
            </Link>
          ))}
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="mobile-drawer__link mobile-drawer__link--accent">
            Dashboard
          </Link>
          <Link href="/waitlist" onClick={() => setMenuOpen(false)} className="mobile-drawer__cta">
            Join beta
          </Link>
        </div>
      ) : null}
    </>
  );
}

function VoidLogo() {
  return (
    <span className="void-logo" aria-hidden="true">
      <span className="void-logo__core" />
      <span className="void-logo__orbit void-logo__orbit--a" />
      <span className="void-logo__orbit void-logo__orbit--b" />
      <span className="void-logo__push" />
    </span>
  );
}
