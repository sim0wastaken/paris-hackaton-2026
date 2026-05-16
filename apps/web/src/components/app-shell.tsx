import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="nav">
        <div className="nav-inner">
          <Link className="brand-lockup" href="/">
            <span aria-hidden="true" className="brand-mark" />
            <span>
              <span className="brand-title">Motive</span>
              <span className="brand-subtitle">
                Campaign workbench
              </span>
            </span>
          </Link>
          <span className="tag tag-solid">
            OpenAI-first v1
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
