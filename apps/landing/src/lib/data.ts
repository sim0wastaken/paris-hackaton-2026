export type HeadlineKey = "conversations" | "before_spend" | "ready" | "legible";

export interface Headline {
  eyebrow: string;
  h1: string[];
  sub: string;
}

export const HEADLINES: Record<HeadlineKey, Headline> = {
  conversations: {
    eyebrow: "Intent infrastructure for AI-native acquisition",
    h1: ["Find the conversations", "where your product", "should show up."],
    sub: "Motive maps the AI-mediated buying conversations your product belongs in — then turns them into context hints, ad groups, creative angles, and the landing-page fixes you need before the channel gets crowded.",
  },
  before_spend: {
    eyebrow: "The layer before the ad spend",
    h1: ["Build the intent map", "before the ad spend."],
    sub: "Motive translates your website, ICP, and competitors into the conversational intent surface where buyers will be delegating decisions to AI — and ships you launch-ready ChatGPT Ads assets.",
  },
  ready: {
    eyebrow: "ChatGPT Ads, but earlier",
    h1: ["Make your product ready", "for conversational ads."],
    sub: "Most companies will port keywords into a surface that doesn't reward keywords. Motive gives you the intent maps, context hints, and creative coverage that match how AI actually decides.",
  },
  legible: {
    eyebrow: "Become selectable by AI",
    h1: ["Become legible", "to AI buyers."],
    sub: "67% of B2B buyers prefer a rep-free experience. They're delegating shortlisting to AI. Motive makes sure your product is the one that gets picked — before you spend a dollar on media.",
  },
};

export const HEADLINE_KEYS: HeadlineKey[] = ["conversations", "before_spend", "ready", "legible"];
export const HEADLINE_LABELS: Record<HeadlineKey, string> = {
  conversations: "Conversations",
  before_spend: "Before spend",
  ready: "Readiness",
  legible: "Legibility",
};
export const ROTATE_MS = 6200;

export interface DashConversation {
  title: string;
  stage: string;
  group: string;
  gap: string;
  score: number;
}

export const DASH_CONVERSATIONS: DashConversation[] = [
  {
    title:
      "I'm running a 7-person agency, leads are stuck in spreadsheets, Salesforce feels heavy. Need something cheap, Gmail-friendly, live this week.",
    stage: "Switching · Evaluation",
    group: "Lightweight CRM for agencies",
    gap: "Missing Gmail setup proof",
    score: 87,
  },
  {
    title: "Need an auth provider for a Next.js app with teams, roles, and billing. Don't want to build it.",
    stage: "Implementation · Research",
    group: "Next.js auth for SaaS teams",
    gap: "No migration comparison",
    score: 92,
  },
  {
    title: "Vector DB for a local RAG project — small team, want to own the infra, not pay per query.",
    stage: "Build vs. buy",
    group: "Self-hosted vector for RAG",
    gap: "No latency / footprint table",
    score: 78,
  },
];

export type ModuleVisualKind = "intent" | "matrix" | "json" | "groups" | "creative" | "gap";

export interface ProductModule {
  id: string;
  title: string;
  body: string;
  visual: ModuleVisualKind;
}

export const MODULES: ProductModule[] = [
  {
    id: "01",
    title: "Conversational intent map",
    body: "We surface and cluster the 20–50 buying briefs your category actually generates inside AI — by job-to-be-done, not by keyword.",
    visual: "intent",
  },
  {
    id: "02",
    title: "Offer-to-intent matrix",
    body: "Each offer mapped to the exact moments it earns the recommendation. No generic decks — a working matrix you can hand to product, sales, and growth.",
    visual: "matrix",
  },
  {
    id: "03",
    title: "Context hints",
    body: "JSON-ready context hints for OpenAI's ad group format. Broad, thematic, distinct — the way the platform actually rewards.",
    visual: "json",
  },
  {
    id: "04",
    title: "Ad group structure",
    body: "Named, scoped ad groups built around buying briefs and constraints — not channels, not funnels, not 2018 PPC structures.",
    visual: "groups",
  },
  {
    id: "05",
    title: "Creative coverage engine",
    body: "50–150 non-duplicate, intent-specific title/copy variants. Built for usefulness inside the conversation, not outbound shouting.",
    visual: "creative",
  },
  {
    id: "06",
    title: "Landing-page gap analysis",
    body: "Per-conversation page gaps: missing proof, missing setup paths, missing comparisons. The fixes that move conversion before media spend.",
    visual: "gap",
  },
];

export interface WorkflowStep {
  n: string;
  t: string;
  d: string;
}

export const STEPS: WorkflowStep[] = [
  {
    n: "01",
    t: "Connect your context",
    d: "URL · ICP · 3 competitors · sales calls · positioning docs. We ingest the messy reality, not a brand book.",
  },
  {
    n: "02",
    t: "Surface the conversations",
    d: "Motive clusters the 20–50 buying briefs where your product belongs — by job, constraint, and decision stage.",
  },
  {
    n: "03",
    t: "Map offers to intents",
    d: "Every offer matched to the moments it earns recommendation. Mismatches surfaced, not buried.",
  },
  {
    n: "04",
    t: "Build context hints + ad groups",
    d: "Bulk-upload-ready structure: campaigns, ad groups, JSON context hints, character-limit-aware titles and copy.",
  },
  {
    n: "05",
    t: "Generate creative coverage",
    d: "50–150 distinct, useful, intent-specific variants. Tone calibrated for the assistant relationship — not Google Ads.",
  },
  {
    n: "06",
    t: "Ship landing fixes",
    d: "Per-conversation page gaps with rewrite specs. Tracking, UTM, pixel, conversions API checklist included.",
  },
];

export interface SampleRow {
  convo: string;
  stage: string;
  hint: string;
  group: string;
  angle: string;
  gap: string;
}

export const SAMPLE_ROWS: SampleRow[] = [
  {
    convo: "I need an auth provider for a Next.js app with teams, roles, and billing.",
    stage: "Implementation research",
    hint: "developers comparing auth providers for production SaaS",
    group: "Next.js auth for SaaS teams",
    angle: "Launch auth, teams, and roles without building it from scratch.",
    gap: "Needs implementation guide + migration comparison",
  },
  {
    convo: "Vector DB for a small RAG project, want to own the infra.",
    stage: "Build vs. buy",
    hint: "engineers evaluating self-hosted vector stores",
    group: "Self-hosted vector for RAG",
    angle: "Own the infra. Skip the per-query bill.",
    gap: "No latency / footprint comparison table",
  },
  {
    convo: "Easiest way to add evals to my agent before prod.",
    stage: "Late evaluation",
    hint: "ML engineers shipping LLM features under deadline",
    group: "LLM evals for shipping teams",
    angle: "Catch agent regressions before customers do.",
    gap: "Pricing page hides team plan",
  },
  {
    convo: "I'm a 12-person agency switching off Salesforce — Gmail-friendly, live this week.",
    stage: "Switching",
    hint: "small agencies replacing heavy CRMs",
    group: "Lightweight CRM for agencies",
    angle: "The CRM that reads like Gmail.",
    gap: "Missing Gmail setup proof",
  },
];

export interface AudienceItem {
  k: string;
  d: string;
  tag: string;
}

export const AUDIENCES: AudienceItem[] = [
  { k: "B2B SaaS", d: "Clear ICPs, high willingness to pay, deep landing-page gaps. Best wedge.", tag: "Best wedge" },
  { k: "Devtools", d: "Buyers ask AI for implementation paths, not features. We make you the answer.", tag: "Builder-to-builder" },
  { k: "Agencies", d: "White-label ChatGPT Ads readiness for your clients. Audit, decks, intake, reporting.", tag: "Fastest money" },
  { k: "Ecommerce", d: "Catalog → conversational shopping moments. Product-feed enrichment + creative.", tag: "Asset-heavy" },
  { k: "AI products", d: "Position inside the conversations your buyers are already having with another model.", tag: "Self-aware" },
];

export const SPRINT_DELIVERABLES = [
  "30–50 high-intent AI conversations",
  "Offer-to-intent matrix",
  "Context hints (JSON, bulk-ready)",
  "Ad group structure",
  "50–150 ad title / copy variants",
  "Landing-page gap analysis",
  "Competitor positioning risks",
  "Tracking + UTM + pixel checklist",
  "Launch-ready spreadsheet",
];

export interface SprintTier {
  k: string;
  p: string;
  d: string;
  tag?: string;
  accent?: boolean;
}

export const SPRINT_TIERS: SprintTier[] = [
  {
    k: "Signal Audit",
    p: "€2.5k",
    d: "Founders validating if ChatGPT Ads are worth preparing for.",
  },
  {
    k: "Launch Sprint",
    p: "€6.5k",
    d: "B2B SaaS, ecommerce, and AI companies that want campaign-ready assets.",
    tag: "best for launch",
    accent: true,
  },
  {
    k: "Agency / Expansion",
    p: "custom",
    d: "White-label for agencies, or scale-out: more competitors, markets, pages, ongoing testing.",
  },
];

export const MARQUEE_ITEMS = [
  "· conversation intent maps",
  "· context hints",
  "· ad group structure",
  "· creative coverage",
  "· landing gaps",
  "· measurement loops",
  "· agent-readable feeds",
];
