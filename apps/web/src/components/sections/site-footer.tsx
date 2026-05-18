import Link from "next/link";

import { BrandMark } from "@motive/ds/primitives";

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <span className="brand">
          <BrandMark size="sm" />
          <span className="brand-word">Motive</span>
        </span>
        <div className="foot-cols">
          <div>
            <div className="fc-k">Read</div>
            <a href="#demo">The shift</a>
            <a href="#filter">Is this you</a>
          </div>
          <div>
            <div className="fc-k">Start</div>
            <Link href="/intake">Try the demo</Link>
            <a href="#offer">Readiness sprint</a>
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
