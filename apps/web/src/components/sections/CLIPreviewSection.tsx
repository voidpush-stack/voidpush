"use client";

import { useState } from "react";

const COMMANDS = [
  {
    name: "void init",
    desc: "Generate ephemeral identity",
    preview: [
      { t: "cmd", text: "$ void init" },
      { t: "out", text: "Generating Ed25519 keypair locally..." },
      { t: "ok",  text: "✓ Keypair generated (stored: ~/.vpush/identity)" },
      { t: "out", text: "Setting TTL: 72 hours" },
      { t: "ok",  text: "✓ Identity: void_7f3a2b9c" },
      { t: "out", text: "Configuring relay preferences..." },
      { t: "ok",  text: "✓ Ready — you are now in the void" },
      { t: "out", text: "" },
      { t: "warn",text: "⚠  Identity auto-expires in 72h. Use --persist to extend." },
    ],
  },
  {
    name: "void push",
    desc: "Anonymous push through relay chain",
    preview: [
      { t: "cmd", text: "$ void push origin main" },
      { t: "out", text: "Scanning 14 commits for metadata..." },
      { t: "info",text: "  Stripping: author, email, timestamp, paths" },
      { t: "ok",  text: "✓ Metadata stripped from all commits" },
      { t: "out", text: "Building relay chain (min 3 hops)..." },
      { t: "info",text: "  Chain: Tokyo → Frankfurt → Amsterdam" },
      { t: "out", text: "Encrypting payload with relay pubkeys..." },
      { t: "ok",  text: "✓ Encrypted · transmitting..." },
      { t: "ok",  text: "✓ Pushed anonymously to void://org/repo" },
      { t: "out", text: "Quality score: pending (24h review window)" },
    ],
  },
  {
    name: "void score",
    desc: "Fetch quality score for last push",
    preview: [
      { t: "cmd", text: "$ void score" },
      { t: "out", text: "Fetching score for void_7f3a2b9c..." },
      { t: "ok",  text: "✓ Score retrieved" },
      { t: "out", text: "" },
      { t: "out", text: "  Last push  : void://org/repo · main" },
      { t: "info",text: "  Score      : 9.4 / 10" },
      { t: "info",text: "  Rank       : #3 this week · #12 all time" },
      { t: "out", text: "  Reviewers  : 4 (blind, anonymous)" },
      { t: "out", text: '  Feedback   : "Clean refactor, good test coverage"' },
      { t: "out", text: "" },
      { t: "ok",  text: "ZK proof updated · reputation linked across sessions" },
    ],
  },
  {
    name: "void pr",
    desc: "Open anonymous pull request",
    preview: [
      { t: "cmd", text: '$ void pr --title "fix: null handling" --into main' },
      { t: "out", text: "Creating anonymous pull request..." },
      { t: "out", text: "  Stripping author from diff metadata" },
      { t: "info",text: "  Routing through relay: Singapore → Mumbai" },
      { t: "ok",  text: "✓ PR opened anonymously" },
      { t: "out", text: "" },
      { t: "info",text: "  PR #503 · void://org/repo" },
      { t: "out", text: "  Reviewers will see only the diff" },
      { t: "out", text: "  No name · no profile · no avatar" },
    ],
  },
  {
    name: "void relay ls",
    desc: "List available relay nodes",
    preview: [
      { t: "cmd", text: "$ void relay ls" },
      { t: "ok",  text: "✓ 9 relays online" },
      { t: "out", text: "" },
      { t: "info",text: "  R1  Tokyo       JP  · 12ms  · trust 9.8" },
      { t: "info",text: "  R3  Frankfurt   DE  · 22ms  · trust 9.9" },
      { t: "info",text: "  R4  Singapore   SG  · 18ms  · trust 9.7" },
      { t: "info",text: "  R5  Amsterdam   NL  · 19ms  · trust 9.8" },
      { t: "info",text: "  R6  Mumbai      IN  · 44ms  · trust 9.5" },
      { t: "out", text: "  ...4 more (use --verbose)" },
    ],
  },
  {
    name: "void expire",
    desc: "Destroy current identity immediately",
    preview: [
      { t: "cmd", text: "$ void expire" },
      { t: "warn",text: "⚠  This will permanently destroy void_7f3a2b9c" },
      { t: "warn",text: "⚠  All local keys will be wiped. Cannot be undone." },
      { t: "out", text: "" },
      { t: "out", text: "Confirm? [y/N]: y" },
      { t: "out", text: "" },
      { t: "out", text: "Wiping ~/.vpush/identity..." },
      { t: "out", text: "Wiping ~/.vpush/relay-cache..." },
      { t: "ok",  text: "✓ Identity destroyed — you are now in the void" },
      { t: "out", text: "Run void init to become a new ghost" },
    ],
  },
];

const LINE_COLOR: Record<string, string> = {
  cmd:  "var(--ghost)",
  ok:   "var(--green)",
  warn: "var(--yellow)",
  info: "var(--teal)",
  out:  "var(--muted)",
};

export function CLIPreviewSection() {
  const [active, setActive] = useState(0);

  return (
    <div
      id="cli"
      style={{
        position: "relative",
        zIndex: 1,
        padding: "6rem 2rem",
        background: "var(--bg2)",
        borderTop: "1px solid var(--border2)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="s-tag">CLI</div>
        <h2 className="s-title reveal">void-cli.<br />Six commands.</h2>
        <p className="s-desc reveal">Every command designed to leave nothing behind. Click to preview output.</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            marginTop: "3rem",
          }}
        >
          {/* Command list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {COMMANDS.map((cmd, i) => (
              <button
                key={cmd.name}
                onClick={() => setActive(i)}
                style={{
                  padding: "1rem 1.25rem",
                  border: `1px solid ${i === active ? "rgba(167,139,250,.5)" : "var(--border)"}`,
                  borderLeft: i === active ? "2px solid var(--ghost)" : "1px solid var(--border)",
                  background: i === active ? "var(--bg3)" : "var(--bg)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  textAlign: "left",
                  transition: "all 0.2s",
                  fontFamily: "var(--mono)",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "var(--ghost)", fontWeight: 700, minWidth: 120 }}>
                  {cmd.name}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.6 }}>
                  {cmd.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Preview pane */}
          <div
            style={{
              border: "1px solid var(--border)",
              background: "var(--bg)",
              display: "flex",
              flexDirection: "column",
              minHeight: 360,
            }}
          >
            {/* Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                borderBottom: "1px solid var(--border)",
                background: "rgba(17,24,32,.5)",
              }}
            >
              {["#f87171","#facc15","#4ade80"].map((c) => (
                <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
              <span style={{ flex: 1, textAlign: "center", fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.1em" }}>
                void-cli preview
              </span>
            </div>

            {/* Output */}
            <div style={{ padding: "1.25rem 1.5rem", fontSize: "0.72rem", lineHeight: 1.9, flex: 1 }}>
              {COMMANDS[active].preview.map((line, i) => (
                <span
                  key={i}
                  style={{
                    display: line.t === "cmd" ? "block" : "block",
                    color: LINE_COLOR[line.t] ?? "var(--muted)",
                    marginBottom: line.t === "cmd" ? "0.75rem" : 0,
                    fontWeight: line.t === "cmd" ? 700 : 400,
                  }}
                >
                  {line.text || "\u00a0"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
