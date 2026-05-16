# STACK

One-pager: **Responsibility → Component → Why**, plus one ASCII data-flow diagram.
This is the answer to "what's in this repo" in 60 seconds.

## Responsibility map

| Responsibility | Component | Why |
|----------------|-----------|-----|
| Web app runtime | `apps/web/` | Next.js App Router scaffold for intake, project workspace, review shell, runtime routes, provider clients, Supabase clients, and Inngest registration. |
| Package workspace | `package.json`, `pnpm-workspace.yaml`, `apps/web/package.json` | Root commands drive the web app, tests, build, Supabase CLI, and Inngest Dev Server. |
| Landing/demo reference | `Motive - Landing + SaaS (4)/` | Static React prototype and product copy reference. |
| Product brief | `docs/briefing-files/motive-openai-first-hackathon-plan.md` | Canonical scope for OpenAI-first v1 and Pioneer-after-v1 narrative. |
| Web/source extraction | Tavily + OpenAI extraction calls | Gathers homepage/shop/social context and creates first-draft campaign intelligence. |
| Campaign reasoning | OpenAI / GPT-5-class model | Generates source recap, feature map, conversations, landing gaps, ad groups, creative variants, and story KPIs. |
| Realtime workflow | Supabase Realtime + Inngest/background jobs | Streams each extraction phase into HITL so the demo never stalls on a spinner. |
| Specialist classification | Pioneer | After-v1 classifier trained from stored OpenAI labels and HITL corrections. |
| Constraint extraction | Pioneer GLiNER2 | Later extraction of budget, timeline, integration, team-size, and compliance spans. |
| Creative assets | fal.ai | Generates image/video assets after creative angle selection. |
| Feedback loop | `human_reviews` + story-driven `performance_snapshots` | Captures corrections/outcomes and creates the future Pioneer training set. |
| Hosting | Vercel (project `paris-hackaton-2026`, prod URL https://paris-hackaton-2026.vercel.app) | Serves the Next.js app + serverless route handlers; auto-detects pnpm workspace; Inngest functions served from `/api/inngest`. |
| Production database | Supabase via Vercel Marketplace (`supabase-amber-harbor`, region `cdg1`, ref `aersalcsnejltyklimeb`) | Auto-injects 16 env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, etc.) across Production/Preview/Development. |

## Data flow

```
[URL / shop / social]
        |
        v
[Next.js persisted intake + source status]
        |
        v
[Tavily scrape + OpenAI extraction]
        |
        v
[Persisted source recap, feature map, conversations, landing gaps]
        |
        v
[Realtime HITL review as phases complete]
        |
        v
[Ad groups]
        |
        v
[Title + description + fal.ai creative assets]
        |
        v
[Fake deploy + story-driven monitoring dashboard]
        |
        v
[Stored labels + reviews + performance rows]
        |
        v
[Future Pioneer classifier / Adaptive Inference]
```
