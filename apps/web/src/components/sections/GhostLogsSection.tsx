"use client";

const LOGS = [
  { text: `"I've been coding for 12 years. My GitHub profile with 4k stars still gets dismissed in job interviews the moment they see my name. On VoidPush I merged a critical fix to a project with 80k users. They rated my code 9.8. That's the most honestly I've ever been seen."`, id: "void_3c7e · active 14 days", score: "Q: 9.8", tag: "// contributed to 3 open source projects this month" },
  { text: `"Pushed a refactor that reduced latency by 40%. Lead dev approved it in 6 hours. Same code — different repo — under my real name sat ignored for three weeks. The code didn't change. The perception did. That's the whole problem."`, id: "void_a40f · active 31 days", score: "Q: 9.2", tag: "// rank #7 globally this week" },
  { text: `"I'm a self-taught dev from a country nobody in Silicon Valley has heard of. VoidPush is the first platform where my commits are judged before my LinkedIn. Scored top 10 twice. My real profile has 12 followers."`, id: "void_f55a · active 8 days", score: "Q: 8.7", tag: "// 47 anonymous commits in the last 30 days" },
  { text: `"Used to second-guess every PR because I knew the senior devs would dismiss it. Now I ship first and overthink later. The anonymous feedback loop is brutally honest in exactly the way real code reviews should be."`, id: "void_22b8 · active 22 days", score: "Q: 8.4", tag: "// 12 PRs merged anonymously" },
];

export function AnonLogsSection() {
  return (
    <section id="logs" style={{ position: "relative", zIndex: 1, padding: "6rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
      <div className="s-tag">Anon Logs</div>
      <h2 className="s-title reveal">They shipped.<br />You&apos;ll never know who.</h2>
      <p className="s-desc reveal">Anonymous testimonials from active contributors. Verified by score. Unverifiable by name.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1.5rem", marginTop: "3rem" }}>
        {LOGS.map((log, i) => (
          <div key={i} className="log-card reveal">
            <p style={{ fontSize: "0.75rem", color: "var(--text)", lineHeight: 1.85, marginBottom: "1.25rem", fontStyle: "italic", opacity: 0.85 }}>{log.text}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.63rem", color: "var(--ghost)", opacity: 0.7 }}>{log.id}</span>
              <span className="score-badge">{log.score}</span>
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginTop: "0.5rem" }}>{log.tag}</div>
          </div>
        ))}
      </div>

      <style>{`
        .log-card { border: 1px solid var(--border); background: var(--bg2); padding: 1.75rem; position: relative; overflow: hidden; transition: border-color 0.3s; border-left: 3px solid var(--ghost2); }
        .log-card:hover { border-color: rgba(167,139,250,.35); }
        .score-badge { font-size:.63rem; padding:.2rem .6rem; background:rgba(45,212,191,.08); color:var(--teal); border:1px solid rgba(45,212,191,.15); }
      `}</style>
    </section>
  );
}
