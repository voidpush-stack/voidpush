import Link from "next/link";

const FOOTER_LINKS = [
  { label: "GitHub", href: "https://github.com/voidpush-stack/voidpush", external: true },
  { label: "X / Twitter", href: "https://x.com/voidpush_", external: true },
  { label: "Docs", href: "/docs" },
  { label: "Relays", href: "/network" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <span>
        VoidPush · v0.1.0-alpha ·{" "}
        <span style={{ color: "var(--ghost)" }}>anonymous by default</span>
      </span>

      <span className="site-footer__links">
        {FOOTER_LINKS.map((link) => (
          link.external ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              {link.label}
            </a>
          ) : (
            <Link key={link.label} href={link.href} className="footer-link">
              {link.label}
            </Link>
          )
        ))}
      </span>

      <span style={{ opacity: 0.45 }}>built in the dark</span>
    </footer>
  );
}
