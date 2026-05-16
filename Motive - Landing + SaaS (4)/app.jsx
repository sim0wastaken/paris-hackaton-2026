/* Motive — landing page */
const { useState, useEffect, useRef, useMemo } = React;

const HEADLINES = {
  conversations: {
    eyebrow: "Intent infrastructure for AI-native acquisition",
    h1: ["Find the conversations", "where your product", "should show up."],
    sub: "Motive maps the AI-mediated buying conversations your product belongs in — then turns them into context hints, ad groups, creative angles, and the landing-page fixes you need before the channel gets crowded."
  },
  before_spend: {
    eyebrow: "The layer before the ad spend",
    h1: ["Build the intent map", "before the ad spend."],
    sub: "Motive translates your website, ICP, and competitors into the conversational intent surface where buyers will be delegating decisions to AI — and ships you launch-ready ChatGPT Ads assets."
  },
  ready: {
    eyebrow: "ChatGPT Ads, but earlier",
    h1: ["Make your product ready", "for conversational ads."],
    sub: "Most companies will port keywords into a surface that doesn't reward keywords. Motive gives you the intent maps, context hints, and creative coverage that match how AI actually decides."
  },
  legible: {
    eyebrow: "Become selectable by AI",
    h1: ["Become legible", "to AI buyers."],
    sub: "67% of B2B buyers prefer a rep-free experience. They're delegating shortlisting to AI. Motive makes sure your product is the one that gets picked — before you spend a dollar on media."
  }
};

const ACCENTS = {
  ember:    { hex: "#FF4A1C", soft: "#FFE9DF", on: "#1A0A03", name: "Ember" },
  signal:   { hex: "#3D5AFE", soft: "#E2E7FF", on: "#FFFFFF", name: "Signal" },
  citron:   { hex: "#D4FF3A", soft: "#F1FFB8", on: "#0F1102", name: "Citron" },
  graphite: { hex: "#14130F", soft: "#E9E6DD", on: "#F6F4EE", name: "Graphite" }
};

function Brand({ size = 22 }) {
  return (
    <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="var(--accent)" />
        <path d="M5 16.5 L9 8 L12 13.5 L15 8 L19 16.5" stroke="var(--accent-on)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="12" cy="12" r="11" stroke="var(--ink)" strokeOpacity="0.08" />
      </svg>
      <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: size * 1.1, lineHeight: 1, letterSpacing: "-0.01em", fontStyle: "italic" }}>Motive</span>
    </div>
  );
}

function TopNav() {
  return (
    <header className="nav" data-screen-label="Nav">
      <div className="nav-inner">
        <Brand />
        <nav className="nav-links">
          <a href="#product">Product</a>
          <a href="#workflow">Workflow</a>
          <a href="#sample">Sample output</a>
          <a href="#audience">Who it's for</a>
          <a href="#offer">Sprint</a>
        </nav>
        <div className="nav-cta">
          <a href="#sample" className="btn btn-ghost">View sample</a>
          <a href="#offer" className="btn btn-primary">Get my intent audit <span aria-hidden>→</span></a>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero — intent map dashboard mock ---------------- */
function HeroDashboard() {
  const [active, setActive] = useState(1);
  const conversations = [
    {
      title: "I'm running a 7-person agency, leads are stuck in spreadsheets, Salesforce feels heavy. Need something cheap, Gmail-friendly, live this week.",
      stage: "Switching · Evaluation",
      group: "Lightweight CRM for agencies",
      gap: "Missing Gmail setup proof",
      score: 87
    },
    {
      title: "Need an auth provider for a Next.js app with teams, roles, and billing. Don't want to build it.",
      stage: "Implementation · Research",
      group: "Next.js auth for SaaS teams",
      gap: "No migration comparison",
      score: 92
    },
    {
      title: "Vector DB for a local RAG project — small team, want to own the infra, not pay per query.",
      stage: "Build vs. buy",
      group: "Self-hosted vector for RAG",
      gap: "No latency / footprint table",
      score: 78
    }
  ];
  const c = conversations[active];
  return (
    <div className="hero-dash">
      <div className="dash-chrome">
        <div className="dots"><span></span><span></span><span></span></div>
        <div className="dash-url"><span className="lock">●</span> motive.app / workspace / acme-crm / intent-map</div>
        <div className="dash-meta"><span className="pulse"></span> live</div>
      </div>
      <div className="dash-grid">
        <aside className="dash-side">
          <div className="side-section">
            <div className="side-label">Source</div>
            <div className="side-row"><span className="kbd">URL</span><span className="mono">acmecrm.io</span></div>
            <div className="side-row"><span className="kbd">ICP</span><span>7–25 person agencies</span></div>
            <div className="side-row"><span className="kbd">Geo</span><span>US · CA · UK</span></div>
          </div>
          <div className="side-section">
            <div className="side-label">Competitors</div>
            <div className="chip-row">
              <span className="chip">HubSpot</span>
              <span className="chip">Pipedrive</span>
              <span className="chip">Attio</span>
              <span className="chip dim">+ 3</span>
            </div>
          </div>
        </aside>

        <main className="dash-main">
          <div className="dash-tabs">
            <span className="tab active">Conversations</span>
            <span className="tab">Ad groups</span>
            <span className="tab">Creative</span>
            <span className="tab">Landing</span>
            <span className="tab tab-num">24</span>
          </div>

          <ul className="convo-list">
            {conversations.map((cc, i) => (
              <li key={i} className={"convo " + (i === active ? "is-active" : "")} onClick={() => setActive(i)}>
                <div className="convo-quote">"{cc.title}"</div>
                <div className="convo-meta">
                  <span className="meta-pill">{cc.stage}</span>
                  <span className="meta-dot"></span>
                  <span className="meta-faint">match {cc.score}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="convo-detail">
            <div className="cd-row">
              <div className="cd-label">Recommended ad group</div>
              <div className="cd-value">{c.group}</div>
            </div>
            <div className="cd-row">
              <div className="cd-label">Context hint</div>
              <div className="cd-value cd-mono">{`{ "topic": "${c.group.toLowerCase()}", "intent": "${c.stage.toLowerCase()}", "audience": "founders & ops at small teams" }`}</div>
            </div>
            <div className="cd-row">
              <div className="cd-label">Landing page gap</div>
              <div className="cd-value cd-warn">⚠ {c.gap}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const HEADLINE_KEYS = ["conversations", "before_spend", "ready", "legible"];
const HEADLINE_LABELS = {
  conversations: "Conversations",
  before_spend:  "Before spend",
  ready:         "Readiness",
  legible:       "Legibility"
};
const ROTATE_MS = 6200;

function Hero({ headlineKey }) {
  const auto = headlineKey === "auto";
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // when a specific headline is chosen, lock to its index
  useEffect(() => {
    if (!auto) {
      const i = HEADLINE_KEYS.indexOf(headlineKey);
      if (i >= 0) setIdx(i);
    }
  }, [headlineKey, auto]);

  // rotate when in auto mode
  useEffect(() => {
    if (!auto || paused) return;
    const t = setTimeout(() => setIdx(i => (i + 1) % HEADLINE_KEYS.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [auto, paused, idx]);

  const activeKey = auto ? HEADLINE_KEYS[idx] : (HEADLINE_KEYS.includes(headlineKey) ? headlineKey : HEADLINE_KEYS[0]);
  const h = HEADLINES[activeKey];

  return (
    <section className="hero" data-screen-label="Hero">
      <div className="hero-grid">
        <div
          className="hero-copy"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="hl-stage" key={activeKey}>
            <div className="eyebrow hl-anim" style={{ "--d": "0ms" }}>
              <span className="ey-dot"></span> {h.eyebrow}
            </div>
            <h1 className="display">
              {h.h1.map((line, i) => (
                <span
                  key={i}
                  className={"hl-line hl-anim " + (i === h.h1.length - 1 ? "hl-accent" : "")}
                  style={{ "--d": (80 + i * 90) + "ms" }}
                >
                  {line}
                </span>
              ))}
            </h1>
            <p className="lede hl-anim" style={{ "--d": (140 + h.h1.length * 90) + "ms" }}>{h.sub}</p>
          </div>

          <div className="hl-rotator" aria-hidden={!auto}>
            {HEADLINE_KEYS.map((k, i) => (
              <button
                key={k}
                type="button"
                className={"hlr-dot " + (i === idx ? "is-active" : "")}
                onClick={() => { setIdx(i); setPaused(true); }}
                aria-label={HEADLINE_LABELS[k]}
              >
                <span className="hlr-label">{HEADLINE_LABELS[k]}</span>
                <span className="hlr-track">
                  <span
                    className="hlr-fill"
                    style={{
                      animation: (auto && !paused && i === idx) ? `hlrFill ${ROTATE_MS}ms linear forwards` : "none",
                      width: i < idx ? "100%" : (i === idx && (!auto || paused) ? "100%" : "0%")
                    }}
                  ></span>
                </span>
              </button>
            ))}
          </div>

          <div className="hero-ctas">
            <a href="#offer" className="btn btn-primary btn-lg">Get my AI intent audit <span aria-hidden>→</span></a>
            <a href="#sample" className="btn btn-ghost btn-lg">View sample output</a>
          </div>
          <div className="hero-meta">
            <div className="meta-stack">
              <div className="ms-num">5 days</div>
              <div className="ms-cap">to readiness sprint</div>
            </div>
            <div className="meta-divider"></div>
            <div className="meta-stack">
              <div className="ms-num">20–50</div>
              <div className="ms-cap">buying conversations mapped</div>
            </div>
            <div className="meta-divider"></div>
            <div className="meta-stack">
              <div className="ms-num">100%</div>
              <div className="ms-cap">launch-ready assets</div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <HeroDashboard />
          <div className="hero-foot-note mono">// updated for OpenAI Ads Manager · self-serve beta</div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Problem ---------------- */
function Problem() {
  return (
    <section className="problem" id="problem" data-screen-label="Problem">
      <div className="section-head">
        <div className="kicker mono">01 / The shift</div>
        <h2 className="h2">The old unit was the keyword.<br/><em>The new unit is the conversation.</em></h2>
        <p className="sub-lede">In search, buyers compress intent. In AI, buyers expand it — into a full buying brief with constraints, comparisons, and decision context. You can't port one mental model into the other.</p>
      </div>
      <div className="contrast">
        <article className="contrast-card old">
          <div className="cc-tag">Old surface · 2004–2024</div>
          <div className="cc-quote">"best CRM for startups"</div>
          <ul className="cc-attrs">
            <li><span>Unit</span><span>Keyword</span></li>
            <li><span>Targeting</span><span>What they typed</span></li>
            <li><span>Optimization</span><span>Bid + match type</span></li>
            <li><span>Buyer mode</span><span>Browsing · comparing tabs</span></li>
          </ul>
        </article>
        <div className="contrast-arrow" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M8 24 H40 M28 12 L40 24 L28 36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <article className="contrast-card new">
          <div className="cc-tag">New surface · 2026 →</div>
          <div className="cc-quote">"I'm running a 7-person agency, leads are stuck in spreadsheets, Salesforce feels too heavy, I need something cheap, Gmail-friendly, and live this week."</div>
          <ul className="cc-attrs">
            <li><span>Unit</span><span>Conversation</span></li>
            <li><span>Targeting</span><span>What they're trying to get done</span></li>
            <li><span>Optimization</span><span>Context hints · creative coverage</span></li>
            <li><span>Buyer mode</span><span>Delegating · outsourcing the first 40%</span></li>
          </ul>
        </article>
      </div>
      <div className="problem-foot">
        <div className="pf-stat"><span className="pf-num">67%</span> of B2B buyers prefer a rep-free buying experience.</div>
        <div className="pf-stat"><span className="pf-num">45%</span> used AI during a recent purchase.</div>
        <div className="pf-stat"><span className="pf-num">May 5, 2026</span> OpenAI Ads Manager goes self-serve.</div>
      </div>
    </section>
  );
}

/* ---------------- Product modules ---------------- */
const MODULES = [
  {
    id: "01",
    title: "Conversational intent map",
    body: "We surface and cluster the 20–50 buying briefs your category actually generates inside AI — by job-to-be-done, not by keyword.",
    visual: "intent"
  },
  {
    id: "02",
    title: "Offer-to-intent matrix",
    body: "Each offer mapped to the exact moments it earns the recommendation. No generic decks — a working matrix you can hand to product, sales, and growth.",
    visual: "matrix"
  },
  {
    id: "03",
    title: "Context hints",
    body: "JSON-ready context hints for OpenAI's ad group format. Broad, thematic, distinct — the way the platform actually rewards.",
    visual: "json"
  },
  {
    id: "04",
    title: "Ad group structure",
    body: "Named, scoped ad groups built around buying briefs and constraints — not channels, not funnels, not 2018 PPC structures.",
    visual: "groups"
  },
  {
    id: "05",
    title: "Creative coverage engine",
    body: "50–150 non-duplicate, intent-specific title/copy variants. Built for usefulness inside the conversation, not outbound shouting.",
    visual: "creative"
  },
  {
    id: "06",
    title: "Landing-page gap analysis",
    body: "Per-conversation page gaps: missing proof, missing setup paths, missing comparisons. The fixes that move conversion before media spend.",
    visual: "gap"
  }
];

function ModuleVisual({ kind }) {
  if (kind === "intent") return (
    <svg viewBox="0 0 220 110" className="mod-svg">
      <defs><pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" fill="currentColor" opacity="0.18"/></pattern></defs>
      <rect width="220" height="110" fill="url(#dots)"/>
      <circle cx="110" cy="55" r="6" fill="var(--accent)"/>
      {[
        [40, 30], [180, 30], [40, 85], [180, 85], [110, 18], [110, 95]
      ].map(([x, y], i) => (
        <g key={i}>
          <line x1="110" y1="55" x2={x} y2={y} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 3"/>
          <circle cx={x} cy={y} r="3.5" fill="currentColor" opacity="0.7"/>
        </g>
      ))}
    </svg>
  );
  if (kind === "matrix") return (
    <div className="mod-matrix">
      {Array.from({ length: 16 }).map((_, i) => {
        const on = [0, 5, 6, 9, 10, 11, 14].includes(i);
        return <div key={i} className={"mm-cell " + (on ? "on" : "")}></div>;
      })}
    </div>
  );
  if (kind === "json") return (
    <pre className="mod-json mono">{`{
  "topic": "lightweight crm",
  "intent": "switching",
  "audience": "small agencies",
  "constraints": ["gmail", "fast setup"]
}`}</pre>
  );
  if (kind === "groups") return (
    <div className="mod-groups">
      <div className="mg-row"><span className="mg-dot"></span>Lightweight CRM · agencies</div>
      <div className="mg-row"><span className="mg-dot"></span>Gmail-native pipeline</div>
      <div className="mg-row"><span className="mg-dot"></span>Salesforce alternatives</div>
      <div className="mg-row dim"><span className="mg-dot"></span>+ 9 ad groups</div>
    </div>
  );
  if (kind === "creative") return (
    <div className="mod-creative">
      {[
        "Live in your inbox by Friday.",
        "The CRM that reads like Gmail.",
        "Pipeline without the Salesforce tax.",
        "Built for 7-person agencies."
      ].map((t, i) => (
        <div key={i} className="mc-line"><span className="mc-num mono">A0{i + 1}</span>{t}</div>
      ))}
    </div>
  );
  if (kind === "gap") return (
    <div className="mod-gap">
      <div className="mg-bar"><span style={{ width: "82%" }}></span><b>Setup proof</b></div>
      <div className="mg-bar"><span style={{ width: "44%" }}></span><b>Migration path</b></div>
      <div className="mg-bar"><span style={{ width: "61%" }}></span><b>Pricing clarity</b></div>
      <div className="mg-bar miss"><span style={{ width: "8%" }}></span><b>Gmail integration proof</b></div>
    </div>
  );
  return null;
}

function ProductModules() {
  return (
    <section className="modules" id="product" data-screen-label="Product">
      <div className="section-head">
        <div className="kicker mono">02 / What Motive generates</div>
        <h2 className="h2">Six modules. One acquisition surface.</h2>
        <p className="sub-lede">Not a deck. A working substrate the marketing, growth, and product teams can ship from on day six.</p>
      </div>
      <div className="mod-grid">
        {MODULES.map(m => (
          <article key={m.id} className="mod-card">
            <div className="mod-head">
              <span className="mod-id mono">{m.id}</span>
              <h3 className="mod-title">{m.title}</h3>
            </div>
            <div className="mod-vis"><ModuleVisual kind={m.visual} /></div>
            <p className="mod-body">{m.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Workflow ---------------- */
const STEPS = [
  { n: "01", t: "Connect your context", d: "URL · ICP · 3 competitors · sales calls · positioning docs. We ingest the messy reality, not a brand book." },
  { n: "02", t: "Surface the conversations", d: "Motive clusters the 20–50 buying briefs where your product belongs — by job, constraint, and decision stage." },
  { n: "03", t: "Map offers to intents", d: "Every offer matched to the moments it earns recommendation. Mismatches surfaced, not buried." },
  { n: "04", t: "Build context hints + ad groups", d: "Bulk-upload-ready structure: campaigns, ad groups, JSON context hints, character-limit-aware titles and copy." },
  { n: "05", t: "Generate creative coverage", d: "50–150 distinct, useful, intent-specific variants. Tone calibrated for the assistant relationship — not Google Ads." },
  { n: "06", t: "Ship landing fixes", d: "Per-conversation page gaps with rewrite specs. Tracking, UTM, pixel, conversions API checklist included." }
];

function Workflow() {
  return (
    <section className="workflow" id="workflow" data-screen-label="Workflow">
      <div className="section-head">
        <div className="kicker mono">03 / Workflow</div>
        <h2 className="h2">From website to AI-native acquisition assets.</h2>
      </div>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s.n} className="step">
            <div className="step-rail"><span className="step-n mono">{s.n}</span></div>
            <div className="step-body">
              <h3 className="step-t">{s.t}</h3>
              <p className="step-d">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------- Sample output ---------------- */
const SAMPLE_ROWS = [
  {
    convo: "I need an auth provider for a Next.js app with teams, roles, and billing.",
    stage: "Implementation research",
    hint: "developers comparing auth providers for production SaaS",
    group: "Next.js auth for SaaS teams",
    angle: "Launch auth, teams, and roles without building it from scratch.",
    gap: "Needs implementation guide + migration comparison"
  },
  {
    convo: "Vector DB for a small RAG project, want to own the infra.",
    stage: "Build vs. buy",
    hint: "engineers evaluating self-hosted vector stores",
    group: "Self-hosted vector for RAG",
    angle: "Own the infra. Skip the per-query bill.",
    gap: "No latency / footprint comparison table"
  },
  {
    convo: "Easiest way to add evals to my agent before prod.",
    stage: "Late evaluation",
    hint: "ML engineers shipping LLM features under deadline",
    group: "LLM evals for shipping teams",
    angle: "Catch agent regressions before customers do.",
    gap: "Pricing page hides team plan"
  },
  {
    convo: "I'm a 12-person agency switching off Salesforce — Gmail-friendly, live this week.",
    stage: "Switching",
    hint: "small agencies replacing heavy CRMs",
    group: "Lightweight CRM for agencies",
    angle: "The CRM that reads like Gmail.",
    gap: "Missing Gmail setup proof"
  }
];

function SampleOutput() {
  return (
    <section className="sample" id="sample" data-screen-label="Sample output">
      <div className="section-head">
        <div className="kicker mono">05 / Sample output</div>
        <h2 className="h2">Built for campaign strategy.<br/><em>Not generic ad copy.</em></h2>
        <p className="sub-lede">A row from a real Motive intent map. Every column is something a launch team needs and nothing it doesn't.</p>
      </div>
      <div className="sample-card">
        <div className="sample-head mono">
          <div>Buying conversation</div>
          <div>Stage</div>
          <div>Context hint</div>
          <div>Ad group</div>
          <div>Creative angle</div>
          <div>Landing gap</div>
        </div>
        {SAMPLE_ROWS.map((r, i) => (
          <div key={i} className="sample-row">
            <div className="s-cell s-quote">"{r.convo}"</div>
            <div className="s-cell"><span className="s-pill">{r.stage}</span></div>
            <div className="s-cell mono s-hint">{r.hint}</div>
            <div className="s-cell s-group">{r.group}</div>
            <div className="s-cell s-angle">{r.angle}</div>
            <div className="s-cell s-gap">⚠ {r.gap}</div>
          </div>
        ))}
        <div className="sample-foot mono">
          <span>// row 1 of 47 in the live deliverable</span>
          <a href="#offer">Request the full sample →</a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Audience ---------------- */
const AUDIENCES = [
  { k: "B2B SaaS",   d: "Clear ICPs, high willingness to pay, deep landing-page gaps. Best wedge.", tag: "Best wedge" },
  { k: "Devtools",   d: "Buyers ask AI for implementation paths, not features. We make you the answer.", tag: "Builder-to-builder" },
  { k: "Agencies",   d: "White-label ChatGPT Ads readiness for your clients. Audit, decks, intake, reporting.", tag: "Fastest money" },
  { k: "Ecommerce",  d: "Catalog → conversational shopping moments. Product-feed enrichment + creative.", tag: "Asset-heavy" },
  { k: "AI products",d: "Position inside the conversations your buyers are already having with another model.", tag: "Self-aware" }
];

function Audience() {
  return (
    <section className="audience" id="audience" data-screen-label="Audience">
      <div className="section-head">
        <div className="kicker mono">06 / Who it's for</div>
        <h2 className="h2">Built for companies preparing for AI-native demand capture.</h2>
      </div>
      <div className="aud-grid">
        {AUDIENCES.map(a => (
          <div key={a.k} className="aud-card">
            <div className="aud-tag mono">{a.tag}</div>
            <div className="aud-k">{a.k}</div>
            <div className="aud-d">{a.d}</div>
          </div>
        ))}
      </div>
      <div className="aud-not">
        <span className="aud-not-l mono">// not a fit</span>
        <span>Regulated verticals · companies without a clear offer · "generic ad copy" buyers.</span>
      </div>
    </section>
  );
}

/* ---------------- Offer ---------------- */
function Offer() {
  const deliverables = [
    "30–50 high-intent AI conversations",
    "Offer-to-intent matrix",
    "Context hints (JSON, bulk-ready)",
    "Ad group structure",
    "50–150 ad title / copy variants",
    "Landing-page gap analysis",
    "Competitor positioning risks",
    "Tracking + UTM + pixel checklist",
    "Launch-ready spreadsheet"
  ];
  return (
    <section className="offer" id="offer" data-screen-label="Offer">
      <div className="offer-card">
        <div className="offer-l">
          <div className="kicker mono on-dark">07 / Sprint</div>
          <h2 className="h2 on-dark">ChatGPT Ads Readiness Sprint.</h2>
          <p className="offer-sub">Five days. Your messy positioning becomes a working acquisition substrate for conversational ads — intent map, campaign structure, creative coverage, landing-page fixes, and measurement setup before you spend on the channel.</p>
          <div className="offer-tiers">
            <div className="tier">
              <div className="tier-k">Signal Audit</div>
              <div className="tier-p">€2.5k</div>
              <div className="tier-d">Founders validating if ChatGPT Ads are worth preparing for.</div>
            </div>
            <div className="tier accent">
              <div className="tier-tag">best for launch</div>
              <div className="tier-k">Launch Sprint</div>
              <div className="tier-p">€6.5k</div>
              <div className="tier-d">B2B SaaS, ecommerce, and AI companies that want campaign-ready assets.</div>
            </div>
            <div className="tier">
              <div className="tier-k">Agency / Expansion</div>
              <div className="tier-p">custom</div>
              <div className="tier-d">White-label for agencies, or scale-out: more competitors, markets, pages, ongoing testing.</div>
            </div>
          </div>
          <div className="offer-ctas">
            <a href="#" className="btn btn-primary btn-lg">Get my AI intent audit <span aria-hidden>→</span></a>
            <a href="#sample" className="btn btn-ghost-dark btn-lg">View sample output</a>
          </div>
          <div className="offer-fine">5 sprints / month · we close when full · next cohort opens May 18</div>
        </div>
        <div className="offer-r">
          <div className="del-head mono">// launch sprint deliverables</div>
          <ul className="del-list">
            {deliverables.map((d, i) => (
              <li key={i}><span className="del-n mono">{String(i + 1).padStart(2, "0")}</span>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Founder ---------------- */
function Founder() {
  return (
    <section className="founder" id="founder" data-screen-label="Founder">
      <div className="founder-grid">
        <div className="founder-l">
          <div className="kicker mono">08 / Who's behind it</div>
          <h2 className="h2 h2-tight"><em>"I'm not your U.S. media buyer.</em><br/>I build the technical prep layer that makes your product ready before the channel gets crowded."</h2>
        </div>
        <div className="founder-r">
          <div className="founder-bio">
            Solo technical founder, based in Italy. Background in matching systems, RAG, and B2B acquisition tooling. Motive started after watching companies spend like it was 2014 on a surface that rewards 2026 thinking.
          </div>
          <div className="founder-meta">
            <div><span className="fm-k mono">Why now</span><span>Self-serve OpenAI Ads launched May 5. Most teams will port keywords. The early movers won't.</span></div>
            <div><span className="fm-k mono">Why me</span><span>Builder energy. I ship the audit, the spreadsheet, and the page rewrites — not just the deck.</span></div>
            <div><span className="fm-k mono">Geography</span><span>EU-based by design. Strategy + infra layer, not media buying.</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function FinalCTA() {
  return (
    <section className="final" data-screen-label="Final CTA">
      <div className="final-inner">
        <h2 className="display final-h">
          <span className="hl-line">Know where your product</span>
          <span className="hl-line">should appear</span>
          <span className="hl-line hl-accent"><em>before everyone starts bidding.</em></span>
        </h2>
        <div className="final-ctas">
          <a href="#" className="btn btn-primary btn-lg">Get my AI intent audit <span aria-hidden>→</span></a>
          <a href="#sample" className="btn btn-ghost btn-lg">View sample output</a>
        </div>
        <div className="final-marquee mono">
          <span>· conversation intent maps</span>
          <span>· context hints</span>
          <span>· ad group structure</span>
          <span>· creative coverage</span>
          <span>· landing gaps</span>
          <span>· measurement loops</span>
          <span>· agent-readable feeds</span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <Brand />
        <div className="foot-cols">
          <div><div className="fc-k mono">Product</div><a href="#product">Modules</a><a href="#workflow">Workflow</a></div>
          <div><div className="fc-k mono">Get started</div><a href="#offer">Readiness sprint</a><a href="#sample">Sample output</a><a href="#">Agency program</a></div>
          <div><div className="fc-k mono">Company</div><a href="#founder">Founder</a><a href="#">Manifesto</a><a href="#">Contact</a></div>
        </div>
        <div className="foot-meta mono">© 2026 Motive · intent infrastructure for AI-native acquisition · made in Italy, for the U.S. surface</div>
      </div>
    </footer>
  );
}

/* ---------------- Tweaks ---------------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "ember",
  "headline": "auto",
  "showGrid": true
}/*EDITMODE-END*/;

function MotiveApp() {
  const { TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakSelect, TweakToggle } = window;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const a = ACCENTS[t.accent] || ACCENTS.ember;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", a.hex);
    root.style.setProperty("--accent-soft", a.soft);
    root.style.setProperty("--accent-on", a.on);
    root.dataset.grid = t.showGrid ? "on" : "off";
  }, [t.accent, t.showGrid]);

  return (
    <>
      <TopNav />
      <main className="page">
        <Hero headlineKey={t.headline} />
        <Problem />
        <ProductModules />
        <Workflow />
        <SampleOutput />
        <Audience />
        <Offer />
        <Founder />
        <FinalCTA />
      </main>
      <Footer />
      <TweaksPanel title="Tweaks">
        <TweakSection title="Headline">
          <TweakSelect value={t.headline} onChange={v => setTweak("headline", v)}
            options={[
              { value: "auto",          label: "Auto cycle (all 4)" },
              { value: "conversations", label: "Find the conversations" },
              { value: "before_spend",  label: "Before the ad spend" },
              { value: "ready",         label: "Ready for conversational ads" },
              { value: "legible",       label: "Become legible to AI" }
            ]} />
        </TweakSection>
        <TweakSection title="Accent">
          <TweakRadio value={t.accent} onChange={v => setTweak("accent", v)}
            options={[
              { value: "ember", label: "Ember" },
              { value: "signal", label: "Signal" },
              { value: "citron", label: "Citron" },
              { value: "graphite", label: "Graphite" }
            ]} />
        </TweakSection>
        <TweakSection title="Background grid">
          <TweakToggle value={t.showGrid} onChange={v => setTweak("showGrid", v)} label="Subtle grid" />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MotiveApp />);
