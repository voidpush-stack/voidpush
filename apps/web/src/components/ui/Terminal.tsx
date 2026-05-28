"use client";

import { useEffect, useRef } from "react";

interface TerminalLine {
  type: "prompt" | "cmd" | "out" | "success" | "info" | "accent" | "space" | "end";
  text?: string;
}

const LINES: TerminalLine[] = [
  { type: "prompt", text: "void@null:~$ " },
  { type: "cmd",    text: "void init" },
  { type: "out",    text: "  Generating ephemeral keypair..." },
  { type: "success",text: "  ✓ Identity: void_7f3a2b9c (expires in 72h)" },
  { type: "out",    text: "  ✓ No logs. No trace. No name." },
  { type: "space" },
  { type: "prompt", text: "void@null:~$ " },
  { type: "cmd",    text: "void push origin main" },
  { type: "out",    text: "  Stripping 14 commits of author metadata..." },
  { type: "out",    text: "  Routing through relay chain..." },
  { type: "info",   text: "  ↳ R1:Tokyo → R4:Singapore → R5:Amsterdam → target" },
  { type: "success",text: "  ✓ Pushed anonymously · quality score pending" },
  { type: "space" },
  { type: "end" },
];

const COLOR: Record<string, string> = {
  prompt:  "var(--ghost)",
  cmd:     "var(--text)",
  out:     "var(--muted)",
  success: "var(--green)",
  info:    "var(--blue)",
  accent:  "var(--teal)",
};

export function Terminal() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const lineIdx  = useRef(0);
  const charIdx  = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    function typeNext() {
      if (!body) return;
      const li = lineIdx.current;
      if (li >= LINES.length) return;

      const line = LINES[li];

      if (line.type === "space") {
        const el = document.createElement("span");
        el.style.display = "block";
        el.innerHTML = "&nbsp;";
        body.appendChild(el);
        lineIdx.current++;
        charIdx.current = 0;
        timerRef.current = setTimeout(typeNext, 80);
        return;
      }

      if (line.type === "end") {
        const el = document.createElement("span");
        el.style.display = "block";
        el.innerHTML = `<span style="color:var(--ghost)">void@null:~$</span> <span class="cursor-blink"></span>`;
        body.appendChild(el);
        return;
      }

      const text = line.text ?? "";
      const ci = charIdx.current;

      // Create or get current line element
      let currentEl = body.querySelector(`[data-li="${li}"]`) as HTMLSpanElement | null;
      if (!currentEl) {
        currentEl = document.createElement("span");
        currentEl.style.display = "block";
        currentEl.dataset.li = String(li);
        body.appendChild(currentEl);
      }

      const color = COLOR[line.type] ?? "var(--muted)";
      const typed = text.slice(0, ci + 1);
      currentEl.innerHTML = `<span style="color:${color}">${typed}</span>`;

      charIdx.current++;

      if (charIdx.current >= text.length) {
        lineIdx.current++;
        charIdx.current = 0;
        const delay = line.type === "cmd" ? 420 : 60;
        timerRef.current = setTimeout(typeNext, delay);
      } else {
        const delay = line.type === "cmd" ? 48 : 9;
        timerRef.current = setTimeout(typeNext, delay);
      }
    }

    timerRef.current = setTimeout(typeNext, 900);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div
      style={{
        width: "min(680px, 90vw)",
        border: "1px solid var(--border)",
        background: "rgba(13,17,23,0.95)",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--border)",
          background: "rgba(17,24,32,0.6)",
        }}
      >
        <Dot color="#f87171" />
        <Dot color="#facc15" />
        <Dot color="#4ade80" />
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: "0.63rem",
            color: "var(--muted)",
            letterSpacing: "0.1em",
          }}
        >
          void-cli · bash
        </span>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        style={{
          padding: "1.25rem 1.5rem",
          fontSize: "0.75rem",
          lineHeight: 2,
          minHeight: 200,
          textAlign: "left",
        }}
      />

      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
  );
}
