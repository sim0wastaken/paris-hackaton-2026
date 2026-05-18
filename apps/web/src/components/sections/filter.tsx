import { FILTER_YES, FILTER_NO } from "@/lib/marketing/data";

export function Filter() {
  return (
    <section className="filter" id="filter">
      <div className="section-head">
        <div className="m-kicker">02 — Is this you</div>
        <h2 className="h2">If your buyers are asking AI, we&apos;re built for you.</h2>
        <p className="sub-lede">
          B2B SaaS, devtools, AI products, ecommerce, automotive, fashion, hospitality — anywhere
          a buyer brings constraints to a chat instead of a search box. We run five sprints a
          month and close cohorts when they&apos;re full, so we filter early.
        </p>
      </div>
      <div className="filter-grid">
        <div className="filter-col yes">
          <div className="filter-h">
            <span className="filter-tag">Yes if</span>
            <span className="filter-mark acid">✓</span>
          </div>
          <ul className="filter-list">
            {FILTER_YES.map((t, i) => (
              <li key={i}>
                <span className="fl-bullet acid">●</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="filter-col no">
          <div className="filter-h">
            <span className="filter-tag">Not for you if</span>
            <span className="filter-mark mute">×</span>
          </div>
          <ul className="filter-list">
            {FILTER_NO.map((t, i) => (
              <li key={i}>
                <span className="fl-bullet mute">●</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
