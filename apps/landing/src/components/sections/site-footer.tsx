import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <BrandMark />
        <div className="foot-cols">
          <div>
            <div className="fc-k">Product</div>
            <a href="#product">Modules</a>
            <a href="#workflow">Workflow</a>
          </div>
          <div>
            <div className="fc-k">Get started</div>
            <a href="#offer">Readiness sprint</a>
            <a href="#sample">Sample output</a>
            <a href="#offer">Agency program</a>
          </div>
          <div>
            <div className="fc-k">Company</div>
            <a href="#founder">Founder</a>
            <a href="#problem">Manifesto</a>
            <a href="mailto:hello@motive.app">Contact</a>
          </div>
        </div>
        <div className="foot-meta mono">
          © 2026 Motive · intent infrastructure for AI-native acquisition · made in Italy, for
          the U.S. surface
        </div>
      </div>
    </footer>
  );
}
