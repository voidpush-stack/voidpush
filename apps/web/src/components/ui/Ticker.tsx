const ITEMS = [
  "ghost_7f3a opened PR #482",
  "void_b91d merged into main",
  "void_3c7e scored 9.4 on review",
  "void_a40f pushed 7 commits",
  "void_22b8 closed issue #108",
  "void_d91c ranked #1 this week",
  "void_f55a refactored auth module",
  "void_09e2 merged 12 commits",
  "void_1a4d opened issue #203",
  "void_7c9b fixed null pointer bug",
];

export function Ticker() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div
      style={{
        overflow: "hidden",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "0.6rem 0",
        background: "var(--bg2)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "3rem",
          width: "max-content",
          animation: "ticker 28s linear infinite",
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: "0.63rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--muted)",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {item}
            <span style={{ color: "var(--ghost)", opacity: 0.35 }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
