# RUNBOOK — paris-hackaton-2026

## TL;DR

- Product direction is locked around an OpenAI-first, persisted campaign workflow.
- Authoritative brief: `docs/briefing-files/motive-openai-first-hackathon-plan.md`.
- Demo goal: brand link + context -> streaming OpenAI extraction -> live HITL review -> ad groups -> creatives -> fake deploy -> story-driven monitoring dashboard.

## What runs

| Service / process | Cmd | Port | Notes |
|-------------------|-----|------|-------|
| Web app | `npx pnpm@11.1.2 dev` | 3000 | Runs `apps/web` with `INNGEST_DEV=1`. |
| Supabase local stack | `npx pnpm@11.1.2 db:start` | 54321 / 54322 | Requires Docker; schema lands in Spec 02. |
| Inngest Dev Server | `npx pnpm@11.1.2 inngest:dev` | 8288 | Connects to `http://localhost:3000/api/inngest`. |

## How to bring it up

```sh
npx pnpm@11.1.2 install
cp .env.example .env.local
npx pnpm@11.1.2 dev
```

## Live-verified golden path

- 2026-05-16: `npx pnpm@11.1.2 dev` served `http://localhost:3000`.
- Intake accepted `https://example.com` plus optional context and routed to `/projects/demo-project`.
- Project shell rendered workflow nav: Intake, Extraction / Review, Creatives, Monitoring.
- Review page rendered the extraction phase rail and progressive-output placeholder panels.
- `POST /api/projects/demo-project/extract` returned `{"status":"queued", ...}` with HTTP 200.

## What is stubbed

| Stub | Where | Cross-ref | Lift when |
|------|-------|-----------|-----------|
| MCP servers | Configured at harness, not in-repo | Spec §7.1 | Provision gitnexus, context7, github, chrome-devtools, playwright, sourcegraph |
| Persistence schema | `supabase/migrations/` | Spec 02 | Create core migration and seed data |
| Source ingestion | `apps/web/src/lib/motive/projects.ts` demo shell | Spec 03 | Replace demo project shell with persisted project/source CRUD |
| Real ad-platform deployment | Fake deploy only | OpenAI-first hackathon plan | After demo workflow works |
| Pioneer classifier / retraining | Deferred out of critical path | OpenAI-first hackathon plan | After stored extraction + HITL data exists |

## Known issues

- Public Supabase env is intentionally missing by default; the intake page shows a compact setup warning until `.env.local` is populated.

## Next N hours priorities

1. Define the schema for projects, sources, extraction runs, brand features, conversations, landing gaps, campaigns, ad groups, creative variants, reviews, deployments, performance snapshots, and product feeds.
2. Replace the demo project shell with persisted project/source CRUD.
3. Build OpenAI extraction phases and persist every input/output.
4. Build HITL review pages for validating extracted ideas and proposed ad groups.
5. Generate and persist ad-group creatives: title, description, image/video prompt or asset.
6. Build fake deploy and story-driven monitoring dashboard.
7. Use Supabase Realtime + Inngest/background jobs so extraction phases appear progressively in HITL instead of behind a spinner.

## Pointers (compaction-survive)

Read in order:
1. `CLAUDE.md`
2. `docs/agent-memory/PROGRESS.md`
3. `docs/agent-memory/BLOCKERS.md`
4. `docs/briefing-files/index.md`
5. `docs/briefing-files/motive-openai-first-hackathon-plan.md`
6. `docs/superpowers/plans/2026-05-16-openai-first-demo-plan.md`

## Acceptance contract

Current verification commands:

```sh
npx pnpm@11.1.2 test
npx pnpm@11.1.2 typecheck
npx pnpm@11.1.2 lint
npx pnpm@11.1.2 build
```

The product acceptance contract is:

- User can create a project from a URL and optional context files.
- OpenAI extraction persists source recap, feature map, conversations, landing gaps, and ad-group ideas.
- HITL pages support approving/editing/rejecting extracted ideas.
- Creative generation persists title, description, and image/video prompt or asset per ad group.
- Fake deploy and story-driven monitoring dashboard complete the demo loop.
- Extraction UX is progressive: recap, features, conversations, intents/stages, landing gaps, and ad groups appear as each phase completes.

## Deployment target

_TBD — name one (e.g. "GCP Cloud Run, eu-west", "Fly.io global"). See spec §17.10._
