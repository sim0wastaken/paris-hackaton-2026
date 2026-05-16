import { Marquee } from "@/components/magicui/marquee";
import { MARQUEE_ITEMS } from "@/lib/data";

export function FinalCta() {
  return (
    <section className="final">
      <div className="final-inner">
        <h2 className="display final-h">
          <span className="hl-line">Know where your product</span>
          <span className="hl-line">should appear</span>
          <span className="hl-line hl-accent">
            <em>before everyone starts bidding.</em>
          </span>
        </h2>
        <div className="final-ctas">
          <a href="mailto:hello@motive.app" className="btn btn-primary btn-lg">
            Get my AI intent audit <span aria-hidden>→</span>
          </a>
          <a href="#sample" className="btn btn-ghost-dark btn-lg">
            View sample output
          </a>
        </div>
        <div className="final-marquee-wrap">
          <Marquee pauseOnHover duration="40s">
            {MARQUEE_ITEMS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
