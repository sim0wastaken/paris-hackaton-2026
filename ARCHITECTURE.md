# ARCHITECTURE — Motive (paris-hackaton-2026)

Top-level map of the Motive campaign workbench. Agent legibility document — load this when you need the lay of the land, not the encyclopedia.

Read `CLAUDE.md` first for non-negotiables. Read this for **where things live and what may depend on what**.

---

## One-paragraph summary

User pastes a brand URL into Motive. The intake service ingests sources (URL, PDF, text, screenshot, product feed). An OpenAI extraction pipeline runs five phases — recap → feature map → conversations → landing gaps → ad-group ideas — persisting every input/output to Supabase as it streams. A human reviews each extraction in the HITL workspace; corrections feed back into the next phase. Approved ideas turn into ad groups and creative variants (title, description, image/video prompt or asset via fal.ai). A fake deployment writes a snapshot and a story-driven monitoring dashboard closes the loop with coherent KPIs. Pioneer (a downstream classifier trained on these labels + human corrections) is post-v1.

---

## Top-level layout

```
paris-hackaton-2026/
  CLAUDE.md                 # north-star (non-negotiables, GitNexus block)
  AGENTS.md                 # TOC for any agent (Claude or other)
  ARCHITECTURE.md           # this file
  RELIABILITY.md            # invariants the system must preserve
  SECURITY.md               # what's sensitive, where it lives
  README.md                 # human-facing intro
  RUNBOOK.md                # how to bring things up locally

  apps/
    web/                    # Next.js 16 App Router — primary SaaS
      src/
        app/                # Routes + API handlers (entry layer)
        components/         # React UI (presentational)
        lib/
          motive/           # domain services + schemas (lib of record)
          supabase/         # Supabase client factories
          providers/        # React contexts
        inngest/            # event-queue clients, functions, types
    landing/                # Next.js 16 marketing landing page

  supabase/
    migrations/             # 3 SQL files — core, review actions, creative actions
    seed.sql                # demo dataset

  inngest/                  # (root-level if used) workflow event types

  scripts/                  # one-off Node scripts (.mjs)
  submission/               # hackathon deliverables (public)

  docs/                     # the system of record (see "Knowledge layout")
  .claude/                  # Claude harness (hooks, skills, settings)
  .codex/                   # Codex hook scripts (non-Claude agents)
  .agents/                  # Codex-flavored skill copies (non-Claude agents)
  .gitnexus/                # generated index (lbug gitignored, meta.json committed)
```

---

## Domain layers and dependency rules

Every business domain in `apps/web/src/lib/motive/` lives across these layers. **Dependencies only flow forward.** Cross-layer back-edges are bugs.

```
            ┌──────────────────────────────────────────────────┐
            │  app/             ← Next.js routes + API         │  (entry)
            │  components/      ← React presentational         │
            └────────────┬─────────────────────────────────────┘
                         │ may import from
                         ▼
            ┌──────────────────────────────────────────────────┐
            │  lib/motive/<domain>.ts        ← Service         │  (business logic)
            │  lib/motive/<domain>-actions.ts ← Server actions │
            └────────────┬─────────────────────────────────────┘
                         │ may import from
                         ▼
            ┌──────────────────────────────────────────────────┐
            │  lib/motive/supabase-<domain>.ts ← Data access   │  (persistence)
            │  lib/motive/types.ts             ← Zod schemas   │
            │  lib/motive/extraction-schemas.ts                │
            └────────────┬─────────────────────────────────────┘
                         │ may import from
                         ▼
            ┌──────────────────────────────────────────────────┐
            │  lib/supabase/    ← client factories             │  (providers)
            │  inngest/         ← event types + clients        │
            │  External: OpenAI, fal.ai, Tavily                │
            └──────────────────────────────────────────────────┘
```

**Allowed edges (✓) / disallowed (✗):**

| From → To | app/ | components/ | lib/motive/*.ts | lib/motive/supabase-*.ts | lib/supabase/ | inngest/ |
|---|---|---|---|---|---|---|
| `app/`              | —   | ✓   | ✓ | ✗ direct | ✓ | ✓ |
| `components/`       | ✗   | —   | ✓ | ✗ | ✗ direct | ✗ |
| `lib/motive/*.ts`   | ✗   | ✗   | ✓ peer | ✓ | ✓ | ✓ |
| `lib/motive/supabase-*.ts` | ✗ | ✗ | ✗ back | — | ✓ | ✗ |
| `inngest/`          | ✗   | ✗   | ✓ | ✓ | ✓ | — |

Rules of thumb:
- **Routes/components never call Supabase directly.** They go through `lib/motive/<domain>.ts`, which delegates to `supabase-<domain>.ts`.
- **Inngest functions are async glue.** They invoke the same services routes use, but with event payloads instead of HTTP bodies.
- **Schemas are the contract.** `lib/motive/types.ts` and `extraction-schemas.ts` hold every Zod schema. Parse at the boundary; never `as` cast.

Mechanical enforcement: see `apps/web/eslint-rules/no-cross-layer-import.js` (Pillar 3 of the harness upgrade plan).

---

## Data model: 14 core tables

All in `supabase/migrations/202605160001_motive_core.sql`. Live regenerated summary in `docs/generated/db-schema.md`. RLS enabled on every table.

| # | Table | Role |
|---|---|---|
| 1 | `projects` | Top-level workbench unit; one per brand link |
| 2 | `sources` | Ingested artifacts (URL, PDF, text, screenshot, product feed) |
| 3 | `extraction_runs` | One row per OpenAI extraction phase invocation; carries `provider_payload` |
| 4 | `brand_features` | Extracted features, value props, USPs, use-cases, proof points, objections |
| 5 | `conversations` | Synthetic buyer conversations / intents |
| 6 | `landing_gaps` | Identified gaps on the landing page |
| 7 | `campaigns` | Campaign-level container (objective: Views / Clicks) |
| 8 | `ad_groups` | Generated ad groups belonging to a campaign |
| 9 | `creative_variants` | Title + description + image/video prompt or asset |
| 10 | `human_reviews` | HITL approve / edit / reject / enrich actions, per entity |
| 11 | `deployments` | Fake-deploy snapshots |
| 12 | `performance_snapshots` | Simulated KPIs tied to ad-group / creative quality |
| 13 | `product_feeds` | Uploaded product feeds |
| 14 | `product_feed_items` | Individual SKUs from a product feed |

Migrations 02 and 03 add review-action audit columns. See `supabase/migrations/202605160002_review_actions.sql` and `…0003_creative_review_actions.sql`.

---

## Build order (post-scaffolding milestones)

These are demo-completion milestones, not architectural layers. Each maps to a spec under `docs/superpowers/specs/`.

1. **Scaffold** — backend, frontend, database, CRUD APIs, env wiring, provider clients. (`spec 01`)
2. **Schemas** — projects, sources, extraction runs, brand features, conversations, landing gaps, ad groups, creative variants, human reviews, fake deployments, performance snapshots. (`spec 02`)
3. **Intake / ingestion** — URL, PDF, etc.; Tavily Map+Extract. (`spec 03`)
4. **OpenAI extraction** — five phases, persist every input/output. (`spec 04`)
5. **HITL workspace** — live streaming review UI. (`spec 05`)
6. **Ad-group generation** — from validated extraction rows. (`spec 06`)
7. **Creative generation** — title + description + image/video prompt or asset per ad group. (`spec 07`)
8. **Fake deploy + story monitoring** — coherent KPIs tied to creative quality. (`spec 08`)
9. **Seeded demo resilience** — reset to repeatable state. (`spec 09`)
10. **Pioneer (post-v1)** — downstream classifier from accumulated labels + corrections. (`spec 10`)

Spec index: `docs/superpowers/specs/INDEX.md`. Active execution plan: `docs/exec-plans/active/`.

---

## External providers

| Provider | Used for | Env keys | Notes |
|---|---|---|---|
| OpenAI | Extraction phases, ad-group / creative copy generation | `OPENAI_API_KEY` | Persist every request/response to `extraction_runs.provider_payload` |
| fal.ai | Image / video generation for creative variants | `FAL_KEY` | One asset per `creative_variants` row when `asset_type ≠ 'none'` |
| Tavily | URL ingestion (Map + Extract) | `TAVILY_API_KEY` | Optional fallback flow; see `docs/post-hackathon/tavily-ingestion-deferred.md` |
| Supabase | Database, Realtime, Auth, Storage | `SUPABASE_*` keys (see `.env.example`) | Service-role key only on server |
| Inngest | Background workflows (extraction, creatives, monitoring) | `INNGEST_*` | Local dev via `pnpm inngest:dev` |
| Vercel | Hosting | (Vercel-managed) | Preview-per-PR via the Vercel plugin |

`SECURITY.md` covers what is logged and what is never logged.

---

## Knowledge layout (`docs/`)

```
docs/
  briefing-files/             # authoritative product memos
    index.md                  # which memo is current
    motive-openai-first-hackathon-plan.md
  design-docs/                # operating principles for agents
    index.md
    core-beliefs.md           # distilled non-negotiables (was: knowledge_management_spec)
    golden-principles.md      # mechanical rules used by the GC agent
  exec-plans/                 # execution discipline
    README.md
    active/                   # plans currently being executed
    completed/                # closed plans
    tech-debt-tracker.md      # append-only debt log
  superpowers/
    specs/                    # one spec per subsystem (10 + index + shared contract)
    plans/                    # (legacy: now docs/exec-plans/)
  agent-memory/               # session-survival memory
    PROGRESS.md  DECISIONS.md  BLOCKERS.md
    VERSIONS.md  STACK.md     SECRETS.md  PERF.md
  generated/                  # auto-generated, regenerable, committed
    db-schema.md              # produced by scripts/generate-db-schema-doc.mjs
  references/                 # cached llms.txt-style external docs
    nextjs-llms.txt  supabase-llms.txt  inngest-llms.txt
    openai-responses-llms.txt  fal-llms.txt  tavily-llms.txt  zod-llms.txt
  tech/                       # full setup specs (operating rules)
    knowledge_management_spec.md
  audits/                     # one-off audits
  Hackathon-Briefs/           # original hackathon inputs
  post-hackathon/             # deferred work logs
```

---

## Where to look next

- **Non-negotiables and operating rules** → `CLAUDE.md`
- **What's currently being shipped** → `docs/exec-plans/active/`
- **Quality of each domain** → `docs/QUALITY_SCORE.md`
- **Subsystem deep-dive** → `docs/superpowers/specs/INDEX.md`
- **What can break and how to detect it** → `RELIABILITY.md`
- **Sensitive material** → `SECURITY.md`
- **Library API questions** → `docs/references/*-llms.txt` (Context7 fallback)
- **Recent commits / decisions / blockers** → `docs/agent-memory/`
