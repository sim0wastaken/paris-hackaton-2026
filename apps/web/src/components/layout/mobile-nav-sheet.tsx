"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button, SheetDrawer } from "@motive/ds/primitives";

export interface MobileNavLink {
  href: string;
  label: React.ReactNode;
  description?: React.ReactNode;
}

export interface MobileNavSheetProps {
  brand?: React.ReactNode;
  links: MobileNavLink[];
  footer?: React.ReactNode;
  /** Optional trigger button text/icon override. */
  triggerLabel?: React.ReactNode;
  /** Class applied to the trigger Button. */
  triggerClassName?: string;
}

export function MobileNavSheet({
  brand,
  links,
  footer,
  triggerLabel,
  triggerClassName,
}: MobileNavSheetProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const lastPath = React.useRef(pathname);

  React.useEffect(() => {
    if (pathname !== lastPath.current) {
      lastPath.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onPress={() => setOpen((v) => !v)}
        className={triggerClassName}
        iconLeft={open ? <X size={16} /> : <Menu size={16} />}
      >
        {triggerLabel ?? "Menu"}
      </Button>
      <SheetDrawer
        placement="top"
        isOpen={open}
        onOpenChange={setOpen}
        title={brand}
      >
        {({ close }) => (
          <nav aria-label="Mobile">
            <ul className="motive-mobile-nav-list">
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      data-active={active || undefined}
                      className="motive-mobile-nav-link"
                    >
                      <span className="motive-mobile-nav-label">{link.label}</span>
                      {link.description ? (
                        <span className="motive-mobile-nav-desc">{link.description}</span>
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ul>
            {footer ? <div className="motive-mobile-nav-footer">{footer}</div> : null}
          </nav>
        )}
      </SheetDrawer>
    </>
  );
}
