"use client";

import { useEffect, useMemo, useState } from "react";

type LineTone = "prompt" | "cmd" | "muted" | "ok" | "info" | "warn";

interface TerminalLine {
  tone: LineTone;
  text: string;
}

const SESSIONS: TerminalLine[][] = [
  [
    { tone: "prompt", text: "void@relay-0:~$" },
    { tone: "cmd", text: "vpush init --ttl 72 --link" },
    { tone: "muted", text: "generating ephemeral Ed25519 identity" },
    { tone: "ok", text: "identity void_7f3a2b9c stored locally" },
    { tone: "info", text: "zk chain linked without exposing source identity" },
  ],
  [
    { tone: "prompt", text: "void@relay-0:~$" },
    { tone: "cmd", text: "vpush push origin main --hops 3" },
    { tone: "muted", text: "stripping author, email, timestamp, hostname" },
    { tone: "info", text: "route Tokyo -> Singapore -> Amsterdam -> target" },
    { tone: "ok", text: "bundle encrypted and transmitted" },
  ],
  [
    { tone: "prompt", text: "void@relay-0:~$" },
    { tone: "cmd", text: "vpush score --json" },
    { tone: "muted", text: "blind review window: 24h" },
    { tone: "ok", text: "quality score 9.4 / 10" },
    { tone: "info", text: "rank #3 weekly, proof commitment updated" },
  ],
];

const RELAYS = [
  { id: "R1", city: "Tokyo", ms: 12, status: "sealed" },
  { id: "R4", city: "Singapore", ms: 18, status: "forwarded" },
  { id: "R5", city: "Amsterdam", ms: 19, status: "exit" },
];

const TONE_CLASS: Record<LineTone, string> = {
  prompt: "term-prompt",
  cmd: "term-cmd",
  muted: "term-muted",
  ok: "term-ok",
  info: "term-info",
  warn: "term-warn",
};

export function Terminal() {
  const [session, setSession] = useState(0);
  const [visible, setVisible] = useState(1);

  const lines = useMemo(() => SESSIONS[session], [session]);

  useEffect(() => {
    setVisible(1);
    const timers = lines
      .slice(1)
      .map((_, index) => setTimeout(() => setVisible(index + 2), 520 + index * 360));
    const nextTimer = setTimeout(() => {
      setSession((current) => (current + 1) % SESSIONS.length);
    }, 3600);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(nextTimer);
    };
  }, [lines]);

  return (
    <section className="void-console" aria-label="VoidPush live terminal preview">
      <div className="void-console__header">
        <div className="window-dots" aria-hidden="true">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <span className="void-console__title">relay session / encrypted git bundle</span>
        <span className="void-console__state">LIVE</span>
      </div>

      <div className="void-console__body">
        <div className="void-console__lines">
          {lines.slice(0, visible).map((line, index) => (
            <div key={`${session}-${index}`} className={`terminal-line ${TONE_CLASS[line.tone]}`}>
              {line.tone === "cmd" ? <span className="terminal-caret">$</span> : null}
              <span>{line.text}</span>
            </div>
          ))}
          <div className="terminal-line term-prompt">
            <span>void@relay-0:~$</span>
            <span className="cursor-blink" />
          </div>
        </div>

        <div className="relay-panel" aria-label="Relay path status">
          {RELAYS.map((relay, index) => (
            <div className="relay-node" key={relay.id}>
              <div>
                <span className="relay-node__id">{relay.id}</span>
                <span className="relay-node__city">{relay.city}</span>
              </div>
              <div className="relay-node__meta">
                <span>{relay.ms}ms</span>
                <span>{relay.status}</span>
              </div>
              {index < RELAYS.length - 1 ? <span className="relay-link" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="void-console__footer">
        <div>
          <span className="metric-label">metadata removed</span>
          <span className="metric-value">100%</span>
        </div>
        <div>
          <span className="metric-label">identity TTL</span>
          <span className="metric-value">72h</span>
        </div>
        <div>
          <span className="metric-label">review mode</span>
          <span className="metric-value">blind</span>
        </div>
      </div>
    </section>
  );
}
