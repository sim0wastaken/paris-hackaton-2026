export function Problem() {
  return (
    <section className="problem" id="problem">
      <div className="section-head">
        <div className="kicker mono">01 / The shift</div>
        <h2 className="h2">
          The old unit was the keyword.
          <br />
          <em>The new unit is the conversation.</em>
        </h2>
        <p className="sub-lede">
          In search, buyers compress intent. In AI, buyers expand it — into a full buying brief
          with constraints, comparisons, and decision context. You can&apos;t port one mental
          model into the other.
        </p>
      </div>
      <div className="contrast">
        <article className="contrast-card old">
          <div className="cc-tag">Old surface · 2004–2024</div>
          <div className="cc-quote">&ldquo;best CRM for startups&rdquo;</div>
          <ul className="cc-attrs">
            <li>
              <span>Unit</span>
              <span>Keyword</span>
            </li>
            <li>
              <span>Targeting</span>
              <span>What they typed</span>
            </li>
            <li>
              <span>Optimization</span>
              <span>Bid + match type</span>
            </li>
            <li>
              <span>Buyer mode</span>
              <span>Browsing · comparing tabs</span>
            </li>
          </ul>
        </article>
        <div className="contrast-arrow" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M8 24 H40 M28 12 L40 24 L28 36"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <article className="contrast-card new">
          <div className="cc-tag">New surface · 2026 →</div>
          <div className="cc-quote">
            &ldquo;I&apos;m running a 7-person agency, leads are stuck in spreadsheets,
            Salesforce feels too heavy, I need something cheap, Gmail-friendly, and live this
            week.&rdquo;
          </div>
          <ul className="cc-attrs">
            <li>
              <span>Unit</span>
              <span>Conversation</span>
            </li>
            <li>
              <span>Targeting</span>
              <span>What they&apos;re trying to get done</span>
            </li>
            <li>
              <span>Optimization</span>
              <span>Context hints · creative coverage</span>
            </li>
            <li>
              <span>Buyer mode</span>
              <span>Delegating · outsourcing the first 40%</span>
            </li>
          </ul>
        </article>
      </div>
      <div className="problem-foot">
        <div className="pf-stat">
          <span className="pf-num">67%</span> of B2B buyers prefer a rep-free buying experience.
        </div>
        <div className="pf-stat">
          <span className="pf-num">45%</span> used AI during a recent purchase.
        </div>
        <div className="pf-stat">
          <span className="pf-num">May 5, 2026</span> OpenAI Ads Manager goes self-serve.
        </div>
      </div>
    </section>
  );
}
