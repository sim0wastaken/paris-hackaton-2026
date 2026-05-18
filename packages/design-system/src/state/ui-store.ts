"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DensityMode = "comfortable" | "compact";

export interface MotiveUIState {
  /** Open id of the global command palette (null = closed). */
  commandPaletteOpen: boolean;
  /** Active workspace tab — string slug to keep it transport-friendly. */
  activeWorkspaceTab: string | null;
  /** Layout density (compact = -8px paddings). */
  density: DensityMode;
  /** When set, the next page render highlights a target row. */
  highlightRowId: string | null;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveWorkspaceTab: (slug: string | null) => void;
  setDensity: (density: DensityMode) => void;
  setHighlightRowId: (id: string | null) => void;
}

/**
 * Motive global UI store — small, intentional surface. Use TanStack Query for
 * server state; this store is *only* for cross-page client UI state.
 */
export const useMotiveUI = create<MotiveUIState>()(
  persist(
    (set) => ({
      commandPaletteOpen: false,
      activeWorkspaceTab: null,
      density: "comfortable",
      highlightRowId: null,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setActiveWorkspaceTab: (slug) => set({ activeWorkspaceTab: slug }),
      setDensity: (density) => set({ density }),
      setHighlightRowId: (id) => set({ highlightRowId: id }),
    }),
    {
      name: "motive-ui",
      version: 1,
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : ({} as Storage))),
      // Don't persist transient flags.
      partialize: (state) => ({ density: state.density, activeWorkspaceTab: state.activeWorkspaceTab }),
    },
  ),
);
