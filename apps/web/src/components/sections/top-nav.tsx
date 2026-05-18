import Link from "next/link";

import { BrandMark } from "@motive/ds/primitives";

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
          <Link href="/intake" className="btn btn-primary">
            Try the demo <span className="arr" aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
