"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Compass, FolderKanban, Gauge, LayoutDashboard, Layers } from "lucide-react";
import { CommandPalette, useCommandPaletteHotkey, type CommandItem } from "@motive/ds/primitives";

interface CommandPaletteHostProps {
  /** Additional project-scoped commands (e.g. current project navigation). */
  extra?: CommandItem[];
}

export function CommandPaletteHost({ extra = [] }: CommandPaletteHostProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  useCommandPaletteHotkey(setOpen as (next: (prev: boolean) => boolean) => void);

  const items = React.useMemo<CommandItem[]>(() => {
    const go = (href: string) => () => router.push(href);
    const base: CommandItem[] = [
      {
        id: "go-home",
        label: "Marketing home",
        description: "Public landing page",
        group: "Navigate",
        icon: <Compass size={14} strokeWidth={2} />,
        shortcut: "G H",
        onSelect: go("/"),
      },
      {
        id: "go-intake",
        label: "New intake",
        description: "Start a brand link extraction",
        group: "Navigate",
        icon: <LayoutDashboard size={14} strokeWidth={2} />,
        shortcut: "G I",
        onSelect: go("/intake"),
      },
      {
        id: "go-projects",
        label: "Projects",
        description: "Browse all past projects",
        group: "Navigate",
        icon: <FolderKanban size={14} strokeWidth={2} />,
        shortcut: "G P",
        onSelect: go("/projects"),
      },
      {
        id: "go-design-system",
        label: "Design system",
        description: "Component showcase",
        group: "Navigate",
        icon: <Layers size={14} strokeWidth={2} />,
        onSelect: go("/design-system"),
      },
      ...extra,
    ];
    return base;
  }, [router, extra]);

  return (
    <>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={items}
        recentKey="motive.cmdk.recents"
        placeholder="Type a command or search…"
      />
      {/* Hidden hint so screen readers know ⌘K opens this. The hotkey hook is
          attached above; this label provides an accessible name in the DOM. */}
      <span className="sr-only" aria-hidden>
        Press Cmd+K or Ctrl+K to open the command palette.
      </span>
    </>
  );
}

function detectMetaKey(): string {
  if (typeof navigator === "undefined") return "⌘";
  return /Win|Linux/i.test(navigator.platform) ? "Ctrl" : "⌘";
}

export function CommandPaletteTrigger({ className }: { className?: string }) {
  // Compute once during render. SSR will produce "⌘"; hydration will repaint to
  // the platform-correct value without a setState-in-effect.
  const hint = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    detectMetaKey,
    () => "⌘",
  );
  return (
    <button
      type="button"
      onClick={() => {
        const evt = new KeyboardEvent("keydown", {
          key: "k",
          metaKey: hint === "⌘",
          ctrlKey: hint !== "⌘",
          bubbles: true,
        });
        window.dispatchEvent(evt);
      }}
      className={className ?? "motive-cmdk-trigger"}
      aria-label="Open command palette"
    >
      <Gauge size={14} aria-hidden="true" />
      <span className="motive-cmdk-trigger-label">Search</span>
      <kbd className="motive-menu-kbd">{hint}K</kbd>
    </button>
  );
}
