export type ShowcaseItem = {
  badge: string;
  prompt: string;
  name: string;
  meta: string;
  slot: string;
  tone: string;
};

export const SHOWCASE: ShowcaseItem[] = [
  {
    badge: "Fashion",
    prompt: "I need a warm sweater in green. Under $200.",
    name: "Forest Knit Sweater",
    meta: "$125 · Verve",
    slot: "hero-sweater",
    tone: "#4F7A56",
  },
  {
    badge: "Auto",
    prompt: "Family SUV under €40k. Hybrid preferred.",
    name: "Stellar Hybrid Compact",
    meta: "€34,900 · Northbound",
    slot: "hero-suv",
    tone: "#4A5563",
  },
  {
    badge: "SaaS",
    prompt: "CRM for a 12-person agency. Gmail-friendly, live this week.",
    name: "Attio · Gmail-native CRM",
    meta: "from €34 / seat · launch in 3 days",
    slot: "hero-crm",
    tone: "#5A4E7A",
  },
];

export type ChannelBadge = { k: string; c: string; t: string };

export const CHANNEL_BADGES: ChannelBadge[] = [
  { k: "OA", c: "#10A37F", t: "OpenAI" },
  { k: "G", c: "#4285F4", t: "Gemini" },
  { k: "C", c: "#D97757", t: "Claude" },
  { k: "P", c: "#1FB6A6", t: "Perplexity" },
];

export type ScanRow = { k: string; v: number; you?: boolean };

export const SCAN_ROWS: ScanRow[] = [
  { k: "Attio", v: 71 },
  { k: "Folk", v: 64 },
  { k: "Pipedrive", v: 58 },
  { k: "You", v: 12, you: true },
];

export type GapRow = { k: string; v: number };

export const GAP_ROWS: GapRow[] = [
  { k: "Gmail integration setup proof", v: 8 },
  { k: "Migration story from Salesforce", v: 18 },
  { k: "Pricing visible for sub-€50/seat", v: 32 },
  { k: "5-minute onboarding screenshots", v: 14 },
];

export const FILTER_YES: string[] = [
  "Your buyers — B2B or B2C — are starting decisions inside AI chats. You can already feel it in your traffic.",
  "You have a real product or service with a clear offer and a deliberate price. Not \"we do everything.\"",
  "You'd rather own the surface early, while the auction is cheap, than scramble for it when it isn't.",
];

export const FILTER_NO: string[] = [
  "You sell in a regulated vertical with strict media rules (pharma, gambling, certain financial categories).",
  "You don't have a clear offer to anchor on — the pitch is still \"we help with a lot of things.\"",
  "You're shopping for generic ad copy, not for a launch substrate you'll keep using.",
];

export type Tier = {
  tag?: string;
  k: string;
  p: string;
  d: string;
  accent?: boolean;
};

export const TIERS: Tier[] = [
  {
    k: "Signal audit",
    p: "€2.5k",
    d: "Founders validating whether AI is worth preparing for yet.",
  },
  {
    tag: "Best for launch",
    k: "Launch sprint",
    p: "€6.5k",
    d: "B2B, B2C, ecommerce, devtools, AI products with a clear offer.",
    accent: true,
  },
  {
    k: "Agency / expansion",
    p: "Custom",
    d: "White-label for agencies, or scale-out across markets, pages, ongoing tests.",
  },
];

export const DELIVERABLES: string[] = [
  "30–50 high-intent prompts mapped",
  "Offer-to-prompt matrix",
  "Bulk-ready context signals",
  "Campaign + ad-group structure",
  "50–100 ad title and copy variants",
  "Page-gap analysis by prompt",
  "Competitor positioning risks",
  "Tracking, UTM, pixel, CAPI checklist",
  "Launch-ready spreadsheet",
];

export const MARQUEE_ITEMS: string[] = [
  "Prompt maps",
  "Context signals",
  "Campaign structure",
  "Copy angles",
  "Page fixes",
  "Share of voice",
  "Measurement loops",
];
