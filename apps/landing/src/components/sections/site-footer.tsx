import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <BrandMark />
        <div className="foot-cols">
          <div>
            <div className="fc-k">Read</div>
            <a href="#demo">The shift</a>
            <a href="#filter">Is this you</a>
          </div>
          <div>
            <div className="fc-k">Start</div>
            <a href="#offer">Readiness sprint</a>
            <a href="#">Agency program</a>
          </div>
          <div>
            <div className="fc-k">Company</div>
            <a href="#founder">Founder</a>
            <a href="#">Manifesto</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="foot-meta">© 2026 Motive — get found on ChatGPT — made in Italy</div>
      </div>
    </footer>
  );
}
