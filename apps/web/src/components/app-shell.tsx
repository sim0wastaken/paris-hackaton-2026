import Link from "next/link";

import { BrandMark, Tag } from "@motive/ds/primitives";
import { CommandPaletteHost, CommandPaletteTrigger } from "./layout/command-palette-host";
import { MobileNavSheet, type MobileNavLink } from "./layout/mobile-nav-sheet";

const APP_NAV_LINKS: MobileNavLink[] = [
  { href: "/", label: "Home", description: "Marketing & overview" },
  { href: "/intake", label: "New intake", description: "Drop a brand link" },
  { href: "/projects", label: "Projects", description: "Past & in-flight" },
  { href: "/design-system", label: "Design system", description: "Component reference" },
];

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
            <span className="nav-desktop-only">
              <CommandPaletteTrigger />
            </span>
            <Tag asChild tone="outline" className="nav-desktop-only">
              <Link href="/projects">Projects</Link>
            </Tag>
            <Tag tone="solid" className="nav-tag-version">
              OpenAI-first v1
            </Tag>
            <span className="nav-mobile-only">
              <MobileNavSheet
                links={APP_NAV_LINKS}
                brand={
                  <span className="brand-lockup">
                    <BrandMark />
                    <span className="brand-stack">
                      <span className="brand-title">Motive</span>
                      <span className="brand-subtitle">Campaign workbench</span>
                    </span>
                  </span>
                }
                footer={
                  <span className="t-caption" style={{ display: "block" }}>
                    Paris AI Hackathon · OpenAI-first v1
                  </span>
                }
              />
            </span>
          </div>
        </div>
      </header>
      <CommandPaletteHost />
      {children}
    </div>
  );
}
