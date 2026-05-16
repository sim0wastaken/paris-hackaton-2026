# DECISIONS — ADR-lite

One entry per architectural decision, separator `---`. Once Accepted, never edit — supersede with a new ADR and update the old one's Status line.

Format:

```
## ADR-NNNN — <one-line title>
**Status:** {Proposed, Accepted, Superseded by ADR-NNNN} · **Date:** YYYY-MM-DD
**Context:** <why the decision was needed>
**Decision:** <what was chosen>
**Consequences:** <what this implies, especially tradeoffs>
```

---

## ADR-0001 — Pioneer is the specialist campaign classifier
**Status:** Superseded by ADR-0002 · **Date:** 2026-05-16
**Context:** Motive needs a Pioneer integration that is central to the product and credible for the Paris AI Hackathon. The landing copy and Excalidraw sketch already point toward conversational intent maps, ad groups, landing gaps, creative angles, and a tentative self-improving campaign monitor.
**Decision:** Use Pioneer as the live Conversation/Intent Classifier for demo day. OpenAI/Tavily produce source context and first-draft labels; Pioneer classifies the structured Motive row; GLiNER2 extracts constraints; HITL corrections and campaign outcomes are logged for future retraining / Adaptive Inference.
**Consequences:** The demo should prove a working classifier and an eval chart, not a complete autonomous retraining platform. The self-improving claim must be phrased as a feedback loop that becomes stronger from real corrections and outcomes.
---

## ADR-0002 — Build OpenAI-first and keep Pioneer out of the v1 critical path
**Status:** Accepted · **Date:** 2026-05-16
**Context:** The hackathon needs a concise, lean, demonstrable product. A live Pioneer fine-tune/classifier creates unnecessary dependency risk before Motive has persisted data. The most compelling first demo is the full workflow from brand ingestion to extraction, HITL, ad groups, creatives, fake deploy, and monitoring.
**Decision:** Build the first iteration completely independent from Pioneer. OpenAI powers extraction and generation; the database persists every source, prompt, output, review, ad group, creative, fake deployment, and performance snapshot. Pioneer is positioned as the after-v1 classifier trained from stored OpenAI labels, HITL corrections, and performance rows.
**Consequences:** The immediate build order is scaffold -> schema -> OpenAI extraction -> ad groups -> creatives -> dashboards. Pioneer work starts only after the core product loop works. The Pioneer prize narrative remains credible because the product creates the dataset needed for a smaller classifier.
---

## ADR-0003 — Stream extraction into HITL and generate story KPIs
**Status:** Accepted · **Date:** 2026-05-16
**Context:** Eight OpenAI phases can take 30-90 seconds. A spinner-only waiting screen weakens the live demo. Random mocked KPI numbers also make the monitoring dashboard read as vaporware.
**Decision:** Use Supabase Realtime and/or Inngest events so each completed extraction phase lands into the HITL workspace immediately. Generate performance snapshots as a coherent story tied to creative specificity, intent fit, and landing gaps.
**Consequences:** The demo shows useful rows appearing live: recap, feature map, conversations, intents/stages, landing gaps, and ad groups. The monitoring dashboard can point to a plausible learning signal for future Pioneer training instead of random metrics.
---

## ADR-0004 — Deploy on Vercel with Supabase via Vercel Marketplace; push schema with psql
**Status:** Accepted · **Date:** 2026-05-16
**Context:** Hackathon demo needs a live URL backed by a real Postgres + AI providers, with the shortest reliable path from "code on disk" to "demo URL". Considered: (a) DIY remote Supabase (user creates project, copies four keys), (b) Vercel + Supabase Marketplace (one OAuth, env auto-injected), (c) self-hosted Postgres. The repo is a pnpm monorepo with the Next.js app at `apps/web/`; a stale Vercel project had Root Directory set to `apps` (typo) causing a 404. Schema lives in `supabase/migrations/202605160001_motive_core.sql` + `supabase/seed.sql`; pushing via `supabase db push` requires `supabase login` (browser OAuth) and does not run seed.
**Decision:** (1) Host the Next.js app on Vercel; (2) Provision Supabase via Vercel Marketplace integration in region `cdg1` (Paris) for low-latency to the venue; (3) Fix Root Directory + framework via Vercel REST `PATCH /v9/projects` instead of dashboard; (4) Apply migrations + seed via direct `psql` against `POSTGRES_URL_NON_POOLING` to skip the `supabase login` browser flow; (5) Register Inngest functions via `PUT /api/inngest` (one curl, no Inngest dashboard click); (6) Alias `DATABASE_URL = POSTGRES_URL` (pooled) for serverless app runtime; (7) Hardcode `NEXT_PUBLIC_APP_URL` to the prod URL.
**Consequences:** Single-platform billing through Vercel. Marketplace auto-injects `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the exact name `env.ts` expects (no alias drift). Preview deployments without code changes would point at the prod URL via `NEXT_PUBLIC_APP_URL`; if preview-correct URLs become needed, env.ts must learn to fall back to `VERCEL_URL`. Vercel env changes do not auto-rebuild — every secret rotation needs `vercel --prod --force`. Deployments uploaded from local disk are sensitive to codex mid-edit states; future builds should preferably trigger from `main` once the codex parallel stream stabilizes.
---
