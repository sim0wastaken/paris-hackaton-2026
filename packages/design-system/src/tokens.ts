export const tokens = {
  color: {
    bg: "var(--bg)",
    bg2: "var(--bg-2)",
    surface: "var(--surface)",
    surface2: "var(--surface-2)",
    surface3: "var(--surface-3)",
    ink: "var(--ink)",
    ink2: "var(--ink-2)",
    ink3: "var(--ink-3)",
    ink4: "var(--ink-4)",
    ink5: "var(--ink-5)",
    line: "var(--line)",
    line2: "var(--line-2)",
    line3: "var(--line-3)",
    acid: "var(--acid)",
    acidOn: "var(--acid-on)",
    cyan: "var(--acid-2)",
    warn: "var(--warn)",
    warnSoft: "var(--warn-soft)",
    warnLine: "var(--warn-line)",
    accentSoft: "var(--accent-soft)",
    accentGlow: "var(--accent-glow)",
  },
  space: {
    1: "var(--s-1)",
    2: "var(--s-2)",
    3: "var(--s-3)",
    4: "var(--s-4)",
    5: "var(--s-5)",
    6: "var(--s-6)",
    7: "var(--s-7)",
    8: "var(--s-8)",
    9: "var(--s-9)",
    10: "var(--s-10)",
  },
  radius: {
    xs: "var(--r-xs)",
    sm: "var(--r-sm)",
    md: "var(--r-md)",
    lg: "var(--r-lg)",
    xl: "var(--r-xl)",
    pill: "var(--r-pill)",
  },
  shadow: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    glow: "var(--shadow-glow)",
  },
  duration: {
    fast: "var(--dur-1)",
    base: "var(--dur-2)",
    slow: "var(--dur-3)",
    slower: "var(--dur-4)",
  },
  ease: {
    standard: "var(--ease)",
    out: "var(--ease-out)",
  },
  font: {
    display: "var(--font-display)",
    mono: "var(--font-mono)",
  },
  z: {
    nav: "var(--z-nav)",
  },
} as const;

export type Tokens = typeof tokens;
export type SpaceToken = keyof Tokens["space"];
export type RadiusToken = keyof Tokens["radius"];
export type ColorToken = keyof Tokens["color"];
