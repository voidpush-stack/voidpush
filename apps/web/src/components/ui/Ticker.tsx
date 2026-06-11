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
    <div className="ticker-strip">
      <div className="ticker-strip__track">
        {doubled.map((item, i) => (
          <span key={i} className="ticker-strip__item">
            {item}
            <span className="ticker-strip__diamond">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
