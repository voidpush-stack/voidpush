import Link from "next/link";
import { Terminal } from "@/components/ui/Terminal";
import { Ticker } from "@/components/ui/Ticker";

export function HeroSection() {
  return (
    <>
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8rem 2rem 4rem", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border)", padding: "0.35rem 1rem", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ghost)", marginBottom: "2.5rem", animation: "fadeUp 0.6s ease both" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite", display: "inline-block" }} />
          v0.1.0-alpha · 2,847 contributors active
        </div>

        <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(3rem,8vw,7rem)", fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.04em", marginBottom: "1.5rem", animation: "slideUp 0.8s ease 0.1s both" }}>
          Code without<br />
          <span style={{ color: "var(--ghost)" }}>a face.</span>
        </h1>

        <p style={{ fontSize: "0.9rem", color: "var(--muted)", maxWidth: 520, lineHeight: 1.8, marginBottom: "3rem", animation: "slideUp 0.8s ease 0.2s both" }}>
          VoidPush is an anonymous code contribution network.<br />
          No usernames. No history. No bias.<br />
          Just <span style={{ color: "var(--teal)" }}>pure signal</span> — your code, judged on its own merit.
        </p>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center", marginBottom: "4rem", animation: "slideUp 0.8s ease 0.3s both" }}>
          <Link href="#install" className="btn-primary">→ push to the void</Link>
          <Link href="#how" className="btn-secondary">how it works ↓</Link>
        </div>

        <Terminal />
      </div>
      <Ticker />

      <style>{`
        .btn-primary { background:var(--ghost); color:var(--bg); border:none; padding:.875rem 2rem; font-family:var(--mono); font-size:.78rem; font-weight:700; letter-spacing:.05em; text-decoration:none; display:inline-block; transition:all .2s; }
        .btn-primary:hover { background:#c4b5fd; transform:translateY(-2px); }
        .btn-secondary { background:transparent; color:var(--muted); border:1px solid rgba(100,116,139,.3); padding:.875rem 2rem; font-family:var(--mono); font-size:.78rem; letter-spacing:.05em; text-decoration:none; display:inline-block; transition:all .2s; }
        .btn-secondary:hover { color:var(--text); border-color:var(--muted); }
      `}</style>
    </>
  );
}
