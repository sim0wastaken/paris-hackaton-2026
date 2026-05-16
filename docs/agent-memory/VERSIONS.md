# VERSIONS

Pinned versions for every dep. Updated whenever a dep lands. Consult before running install commands.

## Toolchain

| Tool | Version | Pinned via | Notes |
|------|---------|------------|-------|
| Node.js | 25.9.0 | `/opt/homebrew/Cellar/node/25.9.0_2/bin/node` | Local dev runtime. |
| pnpm | 11.1.2 | `package.json` `packageManager` field | Workspace package manager. |
| React UMD | 18.3.1 | `Motive - Landing + SaaS (4)/Motive Landing.html` | Static landing prototype. |
| Babel standalone | 7.29.0 | `Motive - Landing + SaaS (4)/Motive Landing.html` | Browser JSX transform for prototype only. |

## App packages (`apps/web/package.json`)

| Package | Version | Notes |
|---------|---------|-------|
| next | 15.5.18 | App Router + Turbopack dev/build. |
| react | 19.1.0 | Server Components. |
| react-dom | 19.1.0 | — |
| typescript | ^5 | Strict mode (Next.js default). |
| tailwindcss | ^4 | Tailwind v4 with `@tailwindcss/postcss`. |
| @tailwindcss/postcss | ^4 | PostCSS adapter for Tailwind 4. |
| zod | ^4.4.3 | Env validation + structured-output schemas. |
| openai | ^6.38.0 | OpenAI SDK. Uses `gpt-5-mini` by default; see `OPENAI_MODEL`. |
| @supabase/supabase-js | ^2.105.4 | Browser + service-role clients. |
| @supabase/ssr | ^0.10.3 | Cookie-aware Next.js SSR clients. |
| inngest | ^4.4.0 | Background jobs + Realtime-adjacent orchestration. |
| @tavily/core | ^0.7.3 | Source ingestion (optional; intake degrades gracefully if absent). |
| @fal-ai/client | ^1.10.1 | Creative asset generation (optional; asset gen is skipped if absent). |
| server-only | ^0.0.1 | Marker to keep server modules out of client bundles. |

## Provider APIs

| Provider | API / model surface | Where used | Notes |
|----------|---------------------|------------|-------|
| OpenAI | GPT-5-class extraction / generation; Ads API at `api.ads.openai.com/v1` | Source recap, feature map, conversations, intents, landing gaps, ad groups, creative text, monitoring synthesis; campaign export shape | Critical path for v1. Persist every input/output. |
| Pioneer | Fine-tuning, inference, GLiNER2, Adaptive Inference | After-v1 classifier and future feedback loop | Not critical path for v1 demo. |
| Tavily | Search / extract / crawl | Source context from URL, shop, social profiles | Intake falls back to manual text if absent. |
| fal.ai | Generative media (`fal-ai/flux/schnell` for hackathon images) | Creative image assets, square ≤1200×1200 per OpenAI Ads `chat_card` | Asset gen is skipped if `FAL_KEY` is absent. |

## Infrastructure images

| Image | Tag | Where pinned | Rationale |
|-------|-----|--------------|-----------|
| _TBD — Supabase local stack uses `supabase start` (Docker images managed by Supabase CLI)._ |  |  |  |

> Never use `latest`. Prefer LTS / stable. Be suspicious of `-alpine` variants for data stores (§11.1).
