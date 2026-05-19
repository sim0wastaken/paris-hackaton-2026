// Pruning helpers for Tavily-scraped markdown. Pure functions — no I/O.
//
// Goal: turn a raw Tavily crawl/extract markdown blob (typically dominated by
// image markdown, nav chrome, cookie banners, and social-link clusters) into a
// compact brand-signal text the OpenAI extraction phases can actually ground on.

const IMAGE_MARKDOWN_RE = /!\[[^\]]*\]\([^)]*\)/g;
const NAKED_IMAGE_URL_RE = /^https?:\/\/\S+\.(?:png|jpe?g|gif|svg|webp)(?:\?[^\s]*)?$/i;
const SOCIAL_LINK_RE =
  /^\[(?:facebook|instagram|youtube|linkedin|twitter|x|tiktok|github|pinterest|whatsapp|telegram)\]\((?:[^)]+)\)/i;
const COOKIE_LINE_RE = /\b(?:cookie|consent|gdpr|accetta|rifiuta|preferenze|necessari|preferences|personali|trattamento|privacy policy)\b/i;
const CHROME_LINE_RE = /^(?:home|contact|login|sign\s*in|sign\s*up|cookie|privacy|copyright|©|back to top|menu|skip to (?:content|main)|search)\b/i;
const PUNCTUATION_ONLY_RE = /^[\s\p{P}\p{S}]+$/u;
const TRUNCATION_MARKER = "\n\n[…truncated]\n\n";

export type PruneOptions = {
  maxChars?: number;
};

export function pruneScrapedMarkdown(raw: string, opts: PruneOptions = {}): string {
  if (!raw || typeof raw !== "string") return "";
  const maxChars = opts.maxChars ?? 10_000;

  let text = raw.replace(IMAGE_MARKDOWN_RE, "");

  const lines = text.split("\n");
  const kept: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const original = lines[i];
    const trimmed = original.trim();

    if (!trimmed) {
      kept.push("");
      continue;
    }
    if (NAKED_IMAGE_URL_RE.test(trimmed)) continue;
    if (SOCIAL_LINK_RE.test(trimmed)) continue;
    if (CHROME_LINE_RE.test(trimmed)) continue;
    if (PUNCTUATION_ONLY_RE.test(trimmed)) continue;
    if (COOKIE_LINE_RE.test(trimmed)) continue;

    kept.push(trimmed);
  }

  // Collapse runs of empty lines to a single blank, and dedupe consecutive duplicates.
  const collapsed: string[] = [];
  for (const line of kept) {
    const prev = collapsed[collapsed.length - 1];
    if (line === "" && prev === "") continue;
    if (line && line === prev) continue;
    collapsed.push(line);
  }

  // Trim leading/trailing blank lines.
  while (collapsed.length > 0 && collapsed[0] === "") collapsed.shift();
  while (collapsed.length > 0 && collapsed[collapsed.length - 1] === "") collapsed.pop();

  text = collapsed.join("\n");

  if (text.length <= maxChars) return text;

  // Hard cap: keep first half + last quarter — homepages put hero copy at the
  // top and CTAs / value props at the bottom; nav-heavy middle is the lossy bit.
  const headBudget = Math.floor(maxChars * 0.6);
  const tailBudget = Math.max(0, maxChars - headBudget - TRUNCATION_MARKER.length);
  const head = text.slice(0, headBudget);
  const tail = tailBudget > 0 ? text.slice(text.length - tailBudget) : "";
  return `${head}${TRUNCATION_MARKER}${tail}`;
}
