"use client";

import { useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const COMMANDS = [
  {
    name: "void init",
    desc: "Generate a new ephemeral identity.",
    flags: [
      { flag: "--ttl <hours>",        default: "72",   desc: "Identity time-to-live in hours" },
      { flag: "--persist",            default: "off",  desc: "Disable auto-expiry (manual expire only)" },
      { flag: "--link",               default: "off",  desc: "Link to previous ZK reputation chain" },
      { flag: "--relay-region",       default: "auto", desc: "Preferred relay region: ap, eu, us, sa" },
    ],
    example: `$ void init
  Generating Ed25519 keypair locally...
✓ Keypair generated (stored: ~/.vpush/identity)
  Setting TTL: 72 hours
✓ Identity: void_7f3a2b9c
✓ Ready — you are now in the void

⚠  Identity auto-expires in 72h. Use --persist to extend.`,
    exits: ["0 — success", "1 — identity already exists (run void expire first)", "2 — filesystem error"],
  },
  {
    name: "void push",
    desc: "Push commits anonymously through the relay chain. Strips all author metadata before any network call.",
    flags: [
      { flag: "--hops <n>",             default: "3",   desc: "Number of relay hops (min 3, max 9)" },
      { flag: "--strip-all",            default: "on",  desc: "Strip all metadata (recommended)" },
      { flag: "--preserve-timestamps",  default: "off", desc: "Keep commit timestamps (weakens anonymity)" },
      { flag: "--force",                default: "off", desc: "Force push (equivalent to git push --force)" },
    ],
    example: `$ void push origin main
  Scanning 14 commits for metadata...
  Stripping: author, email, timestamp, paths
✓ Metadata stripped from all commits
  Building relay chain (min 3 hops)...
  Chain: Tokyo → Frankfurt → Amsterdam
✓ Pushed anonymously to void://org/repo
  Quality score: pending (24h review window)`,
    exits: ["0 — success", "1 — no identity (run void init)", "2 — relay unavailable", "3 — auth rejected by remote", "4 — network error"],
  },
  {
    name: "void clone",
    desc: "Clone a repository anonymously. Routes through relay chain and configures anonymous committer identity.",
    flags: [
      { flag: "--depth <n>",    default: "full",    desc: "Shallow clone depth" },
      { flag: "--branch <name>",default: "default", desc: "Clone specific branch" },
    ],
    example: `$ void clone void://org/repo
  Routing clone through relay chain...
✓ Connected via R3:Frankfurt → R5:Amsterdam
  Cloning void://org/repo...
✓ Cloned to ./repo (14 commits, 3 branches)
✓ Anonymous committer configured for this repo`,
    exits: ["0 — success", "1 — no identity", "2 — relay unavailable", "3 — repo not found"],
  },
  {
    name: "void pr",
    desc: "Open an anonymous pull request. Strips all author identity from PR metadata — reviewers see only the diff.",
    flags: [
      { flag: "--title <text>",  default: "required", desc: "PR title" },
      { flag: "--body <text>",   default: "—",        desc: "PR description (supports markdown)" },
      { flag: "--into <branch>", default: "main",     desc: "Target branch" },
      { flag: "--draft",         default: "off",      desc: "Open as draft PR" },
      { flag: "--reviewers <n>", default: "2",        desc: "Minimum blind reviewers requested" },
    ],
    example: `$ void pr --title "fix: null handling in auth" --into main
  Creating anonymous pull request...
  Stripping author from diff metadata
  Routing through relay: Singapore → Mumbai
✓ PR #503 opened anonymously
  Reviewers will see only the diff
  No name · no profile · no avatar`,
    exits: ["0 — success", "1 — no identity", "2 — relay unavailable", "3 — missing --title"],
  },
  {
    name: "void score",
    desc: "Fetch the quality score for your last push or a specific PR.",
    flags: [
      { flag: "--pr <id>",  default: "—",   desc: "Score for specific PR number" },
      { flag: "--all",      default: "off", desc: "Show full history for this void identity" },
      { flag: "--json",     default: "off", desc: "Output as JSON" },
    ],
    example: `$ void score
  Fetching score for void_7f3a2b9c...
✓ Score retrieved

  Last push  : void://org/repo · main
  Score      : 9.4 / 10
  Rank       : #3 this week · #12 all time
  Reviewers  : 4 (blind, anonymous)
  Feedback   : "Clean refactor, good test coverage"

✓ ZK proof updated · reputation linked across sessions`,
    exits: ["0 — success", "1 — no identity", "5 — score not yet available (wait 24h)"],
  },
  {
    name: "void relay ls",
    desc: "List all available relay nodes with latency, trust score, and uptime.",
    flags: [
      { flag: "--verbose",         default: "off",     desc: "Show full relay metadata including uptime" },
      { flag: "--region <name>",   default: "all",     desc: "Filter by region: ap, eu, us, sa" },
      { flag: "--sort <field>",    default: "latency", desc: "Sort by latency, trust, or uptime" },
    ],
    example: `$ void relay ls
✓ 9 relays online (0 degraded)

  R1  Tokyo       JP  · 12ms  · trust 9.8 · uptime 99.97%
  R3  Frankfurt   DE  · 22ms  · trust 9.9 · uptime 99.99%
  R4  Singapore   SG  · 18ms  · trust 9.7 · uptime 99.94%
  R5  Amsterdam   NL  · 19ms  · trust 9.8 · uptime 99.98%
  ...5 more (use --verbose)`,
    exits: ["0 — success", "2 — all relays unreachable"],
  },
  {
    name: "void expire",
    desc: "Immediately and permanently destroy the current identity. 3-pass secure key wipe.",
    flags: [
      { flag: "--force",       default: "off", desc: "Skip confirmation prompt" },
      { flag: "--preserve-zk", default: "off", desc: "Keep ZK chain for future void init --link" },
    ],
    example: `$ void expire
⚠  This will permanently destroy void_7f3a2b9c
⚠  All local keys will be wiped. Cannot be undone.

Confirm? [y/N]: y

  Wiping ~/.vpush/identity...
  Wiping ~/.vpush/relay-cache...
✓ Identity destroyed — you are now in the void`,
    exits: ["0 — success", "1 — no identity to expire"],
  },
];

const GLOBAL_FLAGS = [
  { flag: "--verbose",      desc: "Show full relay chain and timing info" },
  { flag: "--dry-run",      desc: "Simulate command without network calls" },
  { flag: "--relay <id>",   desc: "Force specific relay node as entry point" },
  { flag: "--no-zk",        desc: "Disable ZK linking (fully ephemeral, no reputation)" },
  { flag: "--config <path>",desc: "Use alternate config file (default: ~/.vpush/config)" },
];

const ERROR_CODES = [
  { code: "E001", meaning: "No identity found",           fix: "Run void init" },
  { code: "E002", meaning: "Identity expired",            fix: "Run void expire && void init" },
  { code: "E003", meaning: "All relays unreachable",      fix: "Check network, try void relay ls" },
  { code: "E004", meaning: "Remote rejected push",        fix: "Check repo permissions or void:// URL" },
  { code: "E005", meaning: "Score not yet available",     fix: "Scores take up to 24h after push" },
  { code: "E006", meaning: "ZK proof invalid",            fix: "Run void init (reputation chain may be corrupted)" },
  { code: "E007", meaning: "Metadata strip failed",       fix: "Check git version (requires ≥ 2.30)" },
];

export default function DocsPage() {
  const [activeCmd, setActiveCmd] = useState(0);
  const [activeTab, setActiveTab] = useState<"commands" | "config" | "errors" | "anonymity">("commands");

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "3rem 2rem 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="s-tag">Documentation</div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              void-cli reference
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, maxWidth: 560 }}>
              Complete command reference for void-cli v0.1.0. Anonymous by default — every command designed to leave nothing behind.
            </p>

            {/* Install */}
            <div style={{ marginTop: "1.5rem", display: "inline-flex", alignItems: "center", gap: "1rem", border: "1px solid var(--border)", padding: "0.75rem 1.25rem", background: "var(--bg)", fontSize: "0.75rem" }}>
              <span style={{ color: "var(--ghost)" }}>$</span>
              <span style={{ color: "var(--teal)" }}>curl -fsSL https://voidpush.dev/install.sh | sh</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: "0", padding: "0 2rem" }}>
            {(["commands", "config", "errors", "anonymity"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "1rem 1.5rem", background: "transparent", border: "none", borderBottom: `2px solid ${activeTab === tab ? "var(--ghost)" : "transparent"}`, color: activeTab === tab ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s" }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>

          {/* COMMANDS TAB */}
          {activeTab === "commands" && (
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "2rem" }}>
              {/* Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem", padding: "0 0.75rem" }}>Commands</div>
                {COMMANDS.map((cmd, i) => (
                  <button key={cmd.name} onClick={() => setActiveCmd(i)}
                    style={{ padding: "0.625rem 0.75rem", background: i === activeCmd ? "var(--bg3)" : "transparent", border: "none", borderLeft: `2px solid ${i === activeCmd ? "var(--ghost)" : "transparent"}`, color: i === activeCmd ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.75rem", textAlign: "left", transition: "all 0.15s" }}>
                    {cmd.name}
                  </button>
                ))}
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", margin: "1rem 0 0.5rem", padding: "0 0.75rem" }}>Global</div>
                {GLOBAL_FLAGS.map((f) => (
                  <div key={f.flag} style={{ padding: "0.4rem 0.75rem", fontSize: "0.65rem", color: "var(--muted)", lineHeight: 1.6 }}>
                    <span style={{ color: "var(--teal)" }}>{f.flag}</span>
                  </div>
                ))}
              </div>

              {/* Command detail */}
              <div>
                <h2 style={{ fontFamily: "var(--mono)", fontSize: "1.25rem", color: "var(--ghost)", marginBottom: "0.5rem" }}>
                  {COMMANDS[activeCmd].name}
                </h2>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, marginBottom: "2rem" }}>
                  {COMMANDS[activeCmd].desc}
                </p>

                {/* Flags */}
                <h3 style={{ fontFamily: "var(--display)", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--text)" }}>Flags</h3>
                <div style={{ border: "1px solid var(--border)", marginBottom: "2rem", background: "var(--bg2)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    <span>Flag</span><span>Default</span><span>Description</span>
                  </div>
                  {COMMANDS[activeCmd].flags.map((f) => (
                    <div key={f.flag} style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", padding: "0.75rem 1rem", borderBottom: "1px solid rgba(167,139,250,0.05)", fontSize: "0.75rem" }}>
                      <span style={{ color: "var(--teal)", fontFamily: "var(--mono)" }}>{f.flag}</span>
                      <span style={{ color: "var(--muted)" }}>{f.default}</span>
                      <span style={{ color: "var(--muted)" }}>{f.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Example output */}
                <h3 style={{ fontFamily: "var(--display)", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--text)" }}>Example output</h3>
                <div style={{ border: "1px solid var(--border)", background: "var(--bg)", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", padding: "0.6rem 0.875rem", borderBottom: "1px solid var(--border)", background: "rgba(17,24,32,.5)" }}>
                    {["#f87171","#facc15","#4ade80"].map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />)}
                  </div>
                  <pre style={{ padding: "1rem 1.25rem", fontSize: "0.72rem", lineHeight: 1.9, color: "var(--muted)", overflowX: "auto", whiteSpace: "pre-wrap" }}>
                    {COMMANDS[activeCmd].example}
                  </pre>
                </div>

                {/* Exit codes */}
                <h3 style={{ fontFamily: "var(--display)", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--text)" }}>Exit codes</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {COMMANDS[activeCmd].exits.map((e) => (
                    <div key={e} style={{ fontSize: "0.72rem", color: "var(--muted)", display: "flex", gap: "0.75rem" }}>
                      <span style={{ color: "var(--teal)", minWidth: 8 }}>·</span>{e}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CONFIG TAB */}
          {activeTab === "config" && (
            <div style={{ maxWidth: 700 }}>
              <h2 style={{ fontFamily: "var(--display)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Config file</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>Default location: <span style={{ color: "var(--teal)" }}>~/.vpush/config</span></p>
              <div style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
                <div style={{ display: "flex", gap: "0.5rem", padding: "0.6rem 0.875rem", borderBottom: "1px solid var(--border)", background: "rgba(17,24,32,.5)" }}>
                  {["#f87171","#facc15","#4ade80"].map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />)}
                  <span style={{ fontSize: "0.63rem", color: "var(--muted)", marginLeft: "auto", marginRight: "auto" }}>~/.vpush/config</span>
                </div>
                <pre style={{ padding: "1.5rem", fontSize: "0.75rem", lineHeight: 2, color: "var(--muted)", overflowX: "auto" }}>{`[identity]
default_ttl = 72          # hours
auto_expire = true
preferred_region = "ap"   # ap | eu | us | sa | auto

[relay]
min_hops = 3
max_latency_ms = 200
trust_threshold = 9.0

[privacy]
strip_timestamps = true
strip_paths = true
strip_hostname = true
zk_linking = true         # accumulate rep across sessions

[network]
timeout_s = 30
retry_attempts = 3`}</pre>
              </div>
            </div>
          )}

          {/* ERRORS TAB */}
          {activeTab === "errors" && (
            <div style={{ maxWidth: 800 }}>
              <h2 style={{ fontFamily: "var(--display)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Error reference</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>All void-cli error codes and their fixes.</p>
              <div style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <span>Code</span><span>Meaning</span><span>Fix</span>
                </div>
                {ERROR_CODES.map((e) => (
                  <div key={e.code} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", padding: "0.875rem 1rem", borderBottom: "1px solid rgba(167,139,250,0.05)", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--yellow)", fontFamily: "var(--mono)" }}>{e.code}</span>
                    <span style={{ color: "var(--text)" }}>{e.meaning}</span>
                    <span style={{ color: "var(--muted)" }}>{e.fix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANONYMITY TAB */}
          {activeTab === "anonymity" && (
            <div style={{ maxWidth: 700 }}>
              <h2 style={{ fontFamily: "var(--display)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Anonymity guarantee</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, marginBottom: "2rem" }}>
                What VoidPush strips, and when. Everything is scrubbed client-side before any network call.
              </p>
              <div style={{ border: "1px solid var(--border)", marginBottom: "2rem" }}>
                <div style={{ padding: "0.75rem 1rem", background: "var(--bg2)", borderBottom: "1px solid var(--border)", fontSize: "0.7rem", color: "var(--ghost)", letterSpacing: "0.08em", textTransform: "uppercase" }}>What is stripped</div>
                {["Author name & email","Committer name & email","Commit timestamps","Local file paths in diffs","Machine hostname","IP address (via relay chain)","Git config identity"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderBottom: "1px solid rgba(167,139,250,0.05)", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--green)" }}>✓</span>
                    <span style={{ color: "var(--text)" }}>{item}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.63rem", color: "var(--muted)" }}>before leaving your machine</span>
                  </div>
                ))}
              </div>
              <div style={{ border: "1px solid var(--border)" }}>
                <div style={{ padding: "0.75rem 1rem", background: "var(--bg2)", borderBottom: "1px solid var(--border)", fontSize: "0.7rem", color: "var(--yellow)", letterSpacing: "0.08em", textTransform: "uppercase" }}>What is NOT hidden</div>
                {["The content of your code (that's the point)","The fact that someone pushed (activity is public)","Your quality score and rank (pseudonymous)"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderBottom: "1px solid rgba(167,139,250,0.05)", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--yellow)" }}>—</span>
                    <span style={{ color: "var(--muted)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
