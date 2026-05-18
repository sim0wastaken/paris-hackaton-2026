import Link from "next/link";

import { BrandMark, Tag } from "@motive/ds/primitives";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="nav">
        <div className="nav-inner">
          <Link className="brand-lockup" href="/">
            <BrandMark />
            <span className="brand-stack">
              <span className="brand-title">Motive</span>
              <span className="brand-subtitle">Campaign workbench</span>
            </span>
          </Link>
          <div className="nav-actions">
            <Tag asChild tone="outline">
              <Link href="/projects">Projects</Link>
            </Tag>
            <Tag tone="solid" className="nav-tag-version">
              OpenAI-first v1
            </Tag>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
