import { MARQUEE_ITEMS } from "@/lib/data";

export function FinalCta() {
  return (
    <section className="final">
      <div className="final-inner">
        <h2 className="display final-h">
          <span className="hl-line">Show up on ChatGPT.</span>
          <span className="hl-line">
            Before everyone <span className="hl-accent">else does</span>.
          </span>
        </h2>
        <div className="final-ctas">
          <a href="#offer" className="btn btn-primary btn-lg">
            Book a readiness sprint <span className="arr" aria-hidden>→</span>
          </a>
          <a href="#demo" className="btn btn-ghost btn-lg">
            Replay the demo
          </a>
        </div>
        <div className="final-marquee">
          {MARQUEE_ITEMS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
