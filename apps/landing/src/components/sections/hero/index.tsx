import { DashboardMock } from "./dashboard-mock";
import { HeadlineRotator } from "./headline-rotator";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <HeadlineRotator />

          <div className="hero-ctas">
            <a href="#offer" className="btn btn-primary btn-lg">
              Get my AI intent audit <span aria-hidden>→</span>
            </a>
            <a href="#sample" className="btn btn-ghost btn-lg">
              View sample output
            </a>
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
          <DashboardMock />
          <div className="hero-foot-note mono">
            {"// updated for OpenAI Ads Manager · self-serve beta"}
          </div>
        </div>
      </div>
    </section>
  );
}
