import Link from "next/link";

import { BrandMark } from "@motive/ds/primitives";
import { MobileNavSheet, type MobileNavLink } from "../layout/mobile-nav-sheet";

const MARKETING_LINKS: MobileNavLink[] = [
  { href: "#demo", label: "The shift" },
  { href: "#filter", label: "Is this you" },
  { href: "#offer", label: "Sprint" },
  { href: "#founder", label: "Founder" },
  { href: "/intake", label: "Try the demo", description: "Drop a brand link" },
  { href: "/projects", label: "Projects", description: "Past & in-flight" },
];

export function TopNav() {
  return (
    <header className="m-nav">
      <div className="m-nav-inner">
        <span className="brand">
          <BrandMark size="sm" />
          <span className="brand-word">Motive</span>
        </span>
        <nav className="m-nav-links">
          <a href="#demo">The shift</a>
          <a href="#filter">Is this you</a>
          <a href="#offer">Sprint</a>
          <a href="#founder">Founder</a>
        </nav>
        <div className="m-nav-cta">
          <Link href="/intake" className="btn btn-primary btn-sm m-nav-cta-desktop">
            Try the demo <span className="arr" aria-hidden>→</span>
          </Link>
          <span className="m-nav-cta-mobile">
            <MobileNavSheet
              links={MARKETING_LINKS}
              brand={
                <span className="brand">
                  <BrandMark size="sm" />
                  <span className="brand-word">Motive</span>
                </span>
              }
              triggerLabel={null}
              triggerClassName="m-nav-cta-trigger"
            />
          </span>
        </div>
      </div>
    </header>
  );
}
