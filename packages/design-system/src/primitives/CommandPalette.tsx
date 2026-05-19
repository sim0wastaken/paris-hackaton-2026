"use client";

import * as React from "react";
import { ArrowRight, Search } from "lucide-react";
import {
  Modal as RACModal,
  ModalOverlay as RACModalOverlay,
  Dialog as RACDialog,
} from "react-aria-components";
import { cn } from "../cn";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  group?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  /** When provided, persists recent selections under this storage key. */
  recentKey?: string;
  /** Max number of recents to remember. Defaults to 5. */
  recentMax?: number;
  emptyMessage?: React.ReactNode;
}

function score(query: string, item: CommandItem): number {
  if (!query) return 1;
  const q = query.toLowerCase().trim();
  const hay = [item.label, item.description ?? "", ...(item.keywords ?? [])]
    .join(" ")
    .toLowerCase();
  if (!q.split(/\s+/).every((tok) => hay.includes(tok))) return 0;
  let s = 0;
  if (item.label.toLowerCase().startsWith(q)) s += 100;
  else if (item.label.toLowerCase().includes(q)) s += 60;
  if ((item.description ?? "").toLowerCase().includes(q)) s += 20;
  s += Math.max(0, 30 - item.label.length);
  return s;
}

function loadRecents(key?: string, max = 5): string[] {
  if (!key || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(0, max);
  } catch {}
  return [];
}

function saveRecents(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Search commands…",
  recentKey,
  recentMax = 5,
  emptyMessage,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [recents, setRecents] = React.useState<string[]>(() => loadRecents(recentKey, recentMax));
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIdx(0);
    } else {
      setRecents(loadRecents(recentKey, recentMax));
      // RAFs to wait for the modal to mount + focus to settle
      requestAnimationFrame(() => requestAnimationFrame(() => inputRef.current?.focus()));
    }
  }, [open, recentKey, recentMax]);

  const grouped = React.useMemo(() => {
    if (query) {
      const ranked = items
        .map((it) => ({ it, s: score(query, it) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((r) => r.it);
      const groups = new Map<string, CommandItem[]>();
      for (const it of ranked) {
        const g = it.group ?? "Results";
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(it);
      }
      return Array.from(groups.entries());
    }
    const groups = new Map<string, CommandItem[]>();
    if (recents.length && recentKey) {
      const recentItems = recents
        .map((id) => items.find((i) => i.id === id))
        .filter(Boolean) as CommandItem[];
      if (recentItems.length) groups.set("Recent", recentItems);
    }
    for (const it of items) {
      const g = it.group ?? "Commands";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(it);
    }
    return Array.from(groups.entries());
  }, [items, query, recents, recentKey]);

  const flat = React.useMemo(() => grouped.flatMap(([, list]) => list), [grouped]);

  React.useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  function commit(item: CommandItem) {
    if (recentKey) {
      const next = [item.id, ...recents.filter((id) => id !== item.id)].slice(0, recentMax);
      setRecents(next);
      saveRecents(recentKey, next);
    }
    onOpenChange(false);
    // Defer the action so the modal can begin closing without competing for focus.
    queueMicrotask(() => item.onSelect());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIdx];
      if (item) commit(item);
    }
  }

  return (
    <RACModalOverlay
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable
      className="motive-overlay motive-command-overlay"
    >
      <RACModal className="motive-command">
        <RACDialog className="outline-none" aria-label="Command palette">
          <div className="motive-command-inner" onKeyDown={handleKeyDown}>
            <div className="motive-command-search">
              <Search size={16} className="motive-command-search-icon" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="motive-command-input"
                autoComplete="off"
                spellCheck={false}
                aria-label="Search commands"
              />
              <kbd className="motive-menu-kbd" aria-hidden="true">ESC</kbd>
            </div>
            <div className="motive-command-list" role="listbox" aria-label="Commands">
              {flat.length === 0 ? (
                <div className="motive-command-empty">
                  {emptyMessage ?? <span className="t-caption">No commands match.</span>}
                </div>
              ) : (
                grouped.map(([group, list]) => (
                  <div key={group} className="motive-command-group">
                    <div className="motive-menu-label">{group}</div>
                    {list.map((item) => {
                      const idx = flat.indexOf(item);
                      const active = idx === activeIdx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          data-active={active || undefined}
                          className={cn("motive-command-item", active && "motive-command-item-active")}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => commit(item)}
                        >
                          {item.icon ? <span className="motive-command-item-icon">{item.icon}</span> : null}
                          <span className="motive-command-item-text">
                            <span className="motive-command-item-label">{item.label}</span>
                            {item.description ? (
                              <span className="motive-command-item-desc">{item.description}</span>
                            ) : null}
                          </span>
                          {item.shortcut ? (
                            <kbd className="motive-menu-kbd">{item.shortcut}</kbd>
                          ) : (
                            <ArrowRight size={12} className="motive-command-item-chev" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <div className="motive-command-footer">
              <span className="t-caption">
                <kbd className="motive-menu-kbd">↑↓</kbd> navigate
              </span>
              <span className="t-caption">
                <kbd className="motive-menu-kbd">↵</kbd> select
              </span>
              <span className="t-caption">
                <kbd className="motive-menu-kbd">esc</kbd> close
              </span>
            </div>
          </div>
        </RACDialog>
      </RACModal>
    </RACModalOverlay>
  );
}
CommandPalette.displayName = "CommandPalette";

/** Hook that binds Cmd/Ctrl+K (and Cmd/Ctrl+P with shift fallback) to toggle the palette. */
export function useCommandPaletteHotkey(setOpen: (next: (prev: boolean) => boolean) => void) {
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpen]);
}
