import Link from "next/link";

import { TIERS, DELIVERABLES } from "@/lib/marketing/data";

export function Offer() {
  return (
    <section className="offer" id="offer">
      <div className="offer-card">
        <div className="offer-l">
          <div className="m-kicker">03 — The sprint</div>
          <h2 className="h2">Five days. One launch-ready map.</h2>
          <p className="offer-sub">
            Your messy positioning, set up before you spend on the channel. Founder-led,
            end-to-end.
          </p>
          <div className="offer-tiers">
            {TIERS.map((tier) => (
              <div key={tier.k} className={"tier " + (tier.accent ? "accent" : "")}>
                {tier.tag && <div className="tier-tag">{tier.tag}</div>}
                <div className="tier-k">{tier.k}</div>
                <div className="tier-p">{tier.p}</div>
                <div className="tier-d">{tier.d}</div>
              </div>
            ))}
          </div>
          <div className="offer-ctas">
            <Link href="/intake" className="btn btn-primary btn-lg">
              Try the demo <span className="arr" aria-hidden>→</span>
            </Link>
            <a href="#demo" className="btn btn-ghost btn-lg">
              Replay the demo
            </a>
          </div>
          <div className="offer-fine">
            5 sprints / month · we close when full · next cohort opens May 18
          </div>
        </div>
        <div className="offer-r">
          <div className="del-head">{"// Launch sprint deliverables"}</div>
          <ul className="del-list">
            {DELIVERABLES.map((d, i) => (
              <li key={i}>
                <span className="del-n">{String(i + 1).padStart(2, "0")}</span>
                <span>{d}</span>
                <span className="del-check">●</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
