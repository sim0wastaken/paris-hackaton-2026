import { BrandMark } from "@/components/brand-mark";

export function TopNav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <BrandMark />
        <nav className="nav-links">
          <a href="#product">Product</a>
          <a href="#workflow">Workflow</a>
          <a href="#sample">Sample output</a>
          <a href="#audience">Who it&apos;s for</a>
          <a href="#offer">Sprint</a>
        </nav>
        <div className="nav-cta">
          <a href="#sample" className="btn btn-ghost">
            View sample
          </a>
          <a href="#offer" className="btn btn-primary">
            Get my intent audit <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </header>
  );
}
