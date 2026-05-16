import { BrandMark } from "@/components/brand-mark";

export function TopNav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <BrandMark />
        <nav className="nav-links">
          <a href="#demo">The shift</a>
          <a href="#filter">Is this you</a>
          <a href="#offer">Sprint</a>
          <a href="#founder">Founder</a>
        </nav>
        <div className="nav-cta">
          <a href="#offer" className="btn btn-primary">
            Book a sprint <span className="arr" aria-hidden>→</span>
          </a>
        </div>
      </div>
    </header>
  );
}
