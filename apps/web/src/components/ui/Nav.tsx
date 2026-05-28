"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { label: "Protocol",    href: "/#how"        },
  { label: "Network",     href: "/network"      },
  { label: "Explore",     href: "/explore"      },
  { label: "Showcase",    href: "/showcase"     },
  { label: "Leaderboard", href: "/leaderboard"  },
  { label: "Blog",        href: "/blog"         },
  { label: "Docs",        href: "/docs"         },
];

export function Nav() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2.5rem",
        borderBottom: "1px solid var(--border)",
        background: scrolled ? "rgba(8,11,16,0.97)" : "rgba(8,11,16,0.82)",
        backdropFilter: "blur(16px)",
        transition: "background 0.3s",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1rem", color: "var(--text)", display: "flex", alignItems: "center", gap: "0.6rem", letterSpacing: "-0.02em" }}>
            <VoidLogo />
            VoidPush
          </span>
        </Link>

        {/* Desktop */}
        <ul className="nav-links" style={{ display: "flex", gap: "1.5rem", listStyle: "none", alignItems: "center" }}>
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link href={href} className="nav-link">{label}</Link>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeToggle />
          <Link href="/waitlist" className="nav-cta">[ join beta ]</Link>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: "none", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", padding: "0.4rem 0.6rem", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.75rem" }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{ position: "fixed", top: "57px", left: 0, right: 0, zIndex: 99, background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)}
              style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.82rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border2)", letterSpacing: "0.06em" }}>
              {label}
            </Link>
          ))}
          <Link href="/waitlist" onClick={() => setMenuOpen(false)}
            style={{ color: "var(--ghost)", textDecoration: "none", fontSize: "0.82rem", padding: "0.5rem 0", fontWeight: 700 }}>
            → join beta
          </Link>
        </div>
      )}

      <style>{`
        .nav-link { color:var(--muted); text-decoration:none; font-size:.68rem; letter-spacing:.08em; text-transform:uppercase; transition:color .2s; font-family:var(--mono); }
        .nav-link:hover { color:var(--ghost); }
        .nav-cta { background:transparent; border:1px solid var(--ghost); color:var(--ghost); padding:.45rem 1rem; font-family:var(--mono); font-size:.7rem; letter-spacing:.05em; text-decoration:none; transition:all .2s; display:inline-block; white-space:nowrap; }
        .nav-cta:hover { background:var(--ghost); color:var(--bg); }
        @media(max-width:900px){ .nav-links { display:none !important; } .hamburger { display:block !important; } }
      `}</style>
    </>
  );
}

function VoidLogo() {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 22, height: 22, flexShrink: 0 }}>
      <span style={{ display: "block", width: 22, height: 22, background: "var(--ghost)", borderRadius: "50% 50% 0 0" }} />
      <span style={{ position: "absolute", bottom: -5, left: 0, right: 0, height: 7, background: "var(--ghost)", clipPath: "polygon(0 0,16.66% 100%,33.33% 0,50% 100%,66.66% 0,83.33% 100%,100% 0,100% 100%,0 100%)" }} />
    </span>
  );
}
