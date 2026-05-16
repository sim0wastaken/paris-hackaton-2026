import { MODULES, type ModuleVisualKind } from "@/lib/data";

function ModuleVisual({ kind }: { kind: ModuleVisualKind }) {
  if (kind === "intent") {
    const nodes: Array<[number, number]> = [
      [40, 30],
      [180, 30],
      [40, 85],
      [180, 85],
      [110, 18],
      [110, 95],
    ];
    return (
      <svg viewBox="0 0 220 110" className="mod-svg">
        <defs>
          <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="currentColor" opacity="0.18" />
          </pattern>
        </defs>
        <rect width="220" height="110" fill="url(#dots)" />
        <circle cx="110" cy="55" r="6" fill="var(--accent)" />
        {nodes.map(([x, y], i) => (
          <g key={i}>
            <line
              x1="110"
              y1="55"
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeDasharray="2 3"
            />
            <circle cx={x} cy={y} r="3.5" fill="currentColor" opacity="0.7" />
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "matrix") {
    const onCells = new Set([0, 5, 6, 9, 10, 11, 14]);
    return (
      <div className="mod-matrix">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={`mm-cell ${onCells.has(i) ? "on" : ""}`}></div>
        ))}
      </div>
    );
  }
  if (kind === "json") {
    return (
      <pre className="mod-json">{`{
  "topic": "lightweight crm",
  "intent": "switching",
  "audience": "small agencies",
  "constraints": ["gmail", "fast setup"]
}`}</pre>
    );
  }
  if (kind === "groups") {
    return (
      <div className="mod-groups">
        <div className="mg-row">
          <span className="mg-dot"></span>Lightweight CRM · agencies
        </div>
        <div className="mg-row">
          <span className="mg-dot"></span>Gmail-native pipeline
        </div>
        <div className="mg-row">
          <span className="mg-dot"></span>Salesforce alternatives
        </div>
        <div className="mg-row dim">
          <span className="mg-dot"></span>+ 9 ad groups
        </div>
      </div>
    );
  }
  if (kind === "creative") {
    const lines = [
      "Live in your inbox by Friday.",
      "The CRM that reads like Gmail.",
      "Pipeline without the Salesforce tax.",
      "Built for 7-person agencies.",
    ];
    return (
      <div className="mod-creative">
        {lines.map((t, i) => (
          <div key={i} className="mc-line">
            <span className="mc-num">A0{i + 1}</span>
            {t}
          </div>
        ))}
      </div>
    );
  }
  if (kind === "gap") {
    return (
      <div className="mod-gap">
        <div className="mg-bar">
          <span style={{ width: "82%" }}></span>
          <span className="mg-pct">82%</span>
          <b>Setup proof</b>
        </div>
        <div className="mg-bar">
          <span style={{ width: "44%" }}></span>
          <span className="mg-pct">44%</span>
          <b>Migration path</b>
        </div>
        <div className="mg-bar">
          <span style={{ width: "61%" }}></span>
          <span className="mg-pct">61%</span>
          <b>Pricing clarity</b>
        </div>
        <div className="mg-bar miss">
          <span style={{ width: "8%" }}></span>
          <span className="mg-pct">8%</span>
          <b>Gmail integration proof</b>
        </div>
      </div>
    );
  }
  return null;
}

export function Modules() {
  return (
    <section className="modules" id="product">
      <div className="section-head">
        <div className="kicker mono">02 / What Motive generates</div>
        <h2 className="h2">Six modules. One acquisition surface.</h2>
        <p className="sub-lede">
          Not a deck. A working substrate the marketing, growth, and product teams can ship
          from on day six.
        </p>
      </div>
      <div className="mod-grid">
        {MODULES.map((m) => (
          <article key={m.id} className="mod-card">
            <div className="mod-head">
              <span className="mod-id mono">{m.id}</span>
              <h3 className="mod-title">{m.title}</h3>
            </div>
            <div className="mod-vis">
              <ModuleVisual kind={m.visual} />
            </div>
            <p className="mod-body">{m.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
