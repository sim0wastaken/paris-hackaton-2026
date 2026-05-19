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
**Consequences:** Single-platform billing through Vercel. Marketplace auto-injects `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the exact name `env.ts` expects (no alias drift). Preview deployments without code changes would point at the prod URL via `NEXT_PUBLIC_APP_URL`; if preview-correct URLs become needed, env.ts must learn to fall back to `VERCEL_URL`. Vercel env changes do not auto-rebuild — every secret rotation needs prod redeploy with --force. Deployments uploaded from local disk are sensitive to codex mid-edit states; future builds should preferably trigger from `main` once the codex parallel stream stabilizes.
---

## ADR-0005 — Apply the OpenAI Codex harness playbook to Motive
**Status:** Accepted · **Date:** 2026-05-18
**Context:** Five months of internal use at OpenAI showed that an agent-first repo ships faster when the **harness** (knowledge layout, hooks, custom linters, agent-to-agent review, garbage collection) is treated as the actual product. Motive's harness already had GitNexus, a north-star CLAUDE.md, ten subsystem specs, three hooks, and per-worktree isolation — but `AGENTS.md` was a thin GitNexus mirror, there was no ARCHITECTURE.md / RELIABILITY.md / SECURITY.md / QUALITY_SCORE.md, no custom layer-import linter, no CI, no agent-to-agent review loop, no doc-gardening / slop-GC mechanism, no in-repo cached library references.
**Decision:** Adopt the Codex playbook adapted for a hackathon timeline. Six commits on `claude/mystifying-bartik-cc6b4f`: (1) delete stale `.codex/hooks.json` with broken absolute paths; (2) split the agent-legibility surface — AGENTS.md becomes a ~90-line TOC, CLAUDE.md keeps the non-negotiables and GitNexus block, dedicated `ARCHITECTURE.md` / `RELIABILITY.md` / `SECURITY.md` / `QUALITY_SCORE.md` files own the depth, `docs/design-docs/{core-beliefs,golden-principles}.md` distill operating principles, plans move from `docs/superpowers/plans/` to `docs/exec-plans/{active,completed}/` with a `tech-debt-tracker.md` sibling; (3) deterministic `scripts/generate-db-schema-doc.mjs` → `docs/generated/db-schema.md` + `scripts/verify-doc-freshness.mjs` + seven in-repo `llms.txt` library cheatsheets under `docs/references/`; (4) two custom ESLint rules (`motive/no-cross-layer-import`, `motive/no-unstructured-log`) wired in `apps/web/eslint.config.mjs`, structured logger at `apps/web/src/lib/motive/log.ts`, `.github/workflows/ci.yml` running lint→typecheck→test→doc-freshness on every PR; (5) two new hooks (`session_start_load_context.sh`, `post_edit_layer_check.sh`) + four slash commands (`/feature`, `/review`, `/gc`, `/grade`); (6) doc-gardening skill at `.claude/skills/doc-gardening/SKILL.md`.
**Consequences:** A fresh agent session now orients via a 90-line TOC instead of a 10KB encyclopedia. Layer-import violations are mechanically surfaced (currently 23, all `warn`-level tech-debt with file lists in `tech-debt-tracker.md` — promote to `error` once migrated). Library docs hit `docs/references/` first and only fall back to Context7. Every PR runs CI. Agents can `/review` their own diff before committing. Slop GC has a recurring entry point (`/gc`). Cost: ~860 lines of new doc, ~310 lines of new build infra, six commits. Hard reverse-edges (the `lib/motive/supabase-*` calls from routes/pages) are tracked but unfixed in this pass — separate PRs per file per the playbook.
---

## ADR-0006 — Replace single-page Tavily extract with crawl + search brand-discovery pipeline
**Status:** Accepted · **Date:** 2026-05-19
**Context:** Intake called `tavily.extract` on the brand homepage exactly once and wrote one `sources` row whose markdown was dominated by image markdown, nav chrome, cookie banners, and social-link clusters. The 6-phase OpenAI extractor (`source_recap → … → ad_groups`) was forced to ground on that noise, producing thin recaps, weak features, and ad groups with all `source_refs` pointing at the same row. The user-supplied intarget.net sample made this concrete: the homepage extract was ~3KB of image URLs and an Italian cookie banner.
**Decision:** Replace the single-call path with a brand-discovery orchestrator: (1) `tavily.crawl` with hand-tuned instructions plus path allow/block lists; (2) Zod-validate the crawl response, falling back to single-page `tavily.extract` (basic → advanced) if the crawl yields zero useful pages; (3) per-page markdown pruning via the pure `pruneScrapedMarkdown` (image strip, social-link strip, cookie-banner heuristic, dedupe, 10K char cap); (4) `tavily.search` for third-party context with `exclude_domains=[brand_host]`; (5) persist N `sources` rows linked to the homepage anchor via a new `parent_source_id` column; (6) emit one `extractionRequested` with the full list of source IDs. Default extraction model bumped to `gpt-5.5`. We kept the direct-`fetch` provider wrapper rather than introducing `@tavily/core` because the existing fetcher-injection pattern is already typed, tested, and easier to keep in sync with vitest mocks during the hackathon window; the new code adds Zod schemas for every Tavily response so the safety guarantee is equivalent.
**Consequences:** Each crawled brand now yields 6–10 brand-signal source rows plus one external-context row, so `source_refs` in extraction outputs resolve to specific pages and HITL traceability becomes real. Phase prompts unchanged — the win comes from cleaner, richer evidence. Extraction-side per-source slice tightened from 12K → 10K to match the prune cap. The shim `extractUrlWithTavily` stays exported so the providers test suite and any seeded fallbacks keep working. Cost per intake: ~1 crawl call + 1 search call + (rare) 2 extract fallbacks vs. the old 1–2 extract calls.
---

