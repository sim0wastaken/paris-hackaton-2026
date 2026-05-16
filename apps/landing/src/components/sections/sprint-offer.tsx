import { SPRINT_DELIVERABLES, SPRINT_TIERS } from "@/lib/data";

export function SprintOffer() {
  return (
    <section className="offer" id="offer">
      <div className="offer-card">
        <div className="offer-l">
          <div className="kicker mono on-dark">07 / Sprint</div>
          <h2 className="h2 on-dark">ChatGPT Ads Readiness Sprint.</h2>
          <p className="offer-sub">
            Five days. Your messy positioning becomes a working acquisition substrate for
            conversational ads — intent map, campaign structure, creative coverage,
            landing-page fixes, and measurement setup before you spend on the channel.
          </p>
          <div className="offer-tiers">
            {SPRINT_TIERS.map((t) => (
              <div key={t.k} className={`tier ${t.accent ? "accent" : ""}`}>
                {t.tag ? <div className="tier-tag">{t.tag}</div> : null}
                <div className="tier-k">{t.k}</div>
                <div className="tier-p">{t.p}</div>
                <div className="tier-d">{t.d}</div>
              </div>
            ))}
          </div>
          <div className="offer-ctas">
            <a href="mailto:hello@motive.app" className="btn btn-primary btn-lg">
              Get my AI intent audit <span aria-hidden>→</span>
            </a>
            <a href="#sample" className="btn btn-ghost-dark btn-lg">
              View sample output
            </a>
          </div>
          <div className="offer-fine">
            5 sprints / month · we close when full · next cohort opens May 18
          </div>
        </div>
        <div className="offer-r">
          <div className="del-head mono">{"// launch sprint deliverables"}</div>
          <ul className="del-list">
            {SPRINT_DELIVERABLES.map((d, i) => (
              <li key={d}>
                <span className="del-n">{String(i + 1).padStart(2, "0")}</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
