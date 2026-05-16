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
- Review page renders the live phase rail, source status, source recap, feature map, conversation, landing-gap, and draft ad-group panels.
- Spec 04 demo replay verified through `POST /api/projects`: six extraction phases succeeded, 6 features / 4 conversations / 4 landing gaps / 2 draft ad groups materialized, and the project moved to `review`.
- No-key non-demo extraction verified: `source_recap` fails with `openai_not_configured`, downstream phases are marked `skipped_dependency_failed`, and prior/domain rows are not erased.
- Spec 05 review actions verified through `POST /api/projects/:id/reviews`: approve, edit, reject, and enrich update the target entity and insert one `human_reviews` row with persisted `before_json` and `after_json`.
- Spec 06 ad-group generation verified through `POST /api/projects/:id/ad-groups/generate`: approved conversations/features/gaps become one OpenAI Ads-compatible campaign plus draft ad groups with `context_hints`, bid defaults, linked conversations, persisted `extraction_runs` input/output, and deterministic fallback when provider use is skipped. Generated ad groups remain reviewable through the existing audit-backed approve/edit/reject/enrich flow.

## What is stubbed

| Stub | Where | Cross-ref | Lift when |
|------|-------|-----------|-----------|
| MCP servers | Configured at harness, not in-repo | Spec §7.1 | Provision gitnexus, context7, github, chrome-devtools, playwright, sourcegraph |
| Live OpenAI provider calls | `apps/web/src/lib/providers/openai.ts` | Spec 04 | Add `OPENAI_API_KEY` and optional `OPENAI_EXTRACTION_MODEL`; demo replay works without keys |
| Real ad-platform deployment | Fake deploy only | OpenAI-first hackathon plan | After demo workflow works |
| Pioneer classifier / retraining | Deferred out of critical path | OpenAI-first hackathon plan | After stored extraction + HITL data exists |

## Known issues

- Public Supabase env is intentionally missing by default; the intake page shows a compact setup warning until `.env.local` is populated.
- Local Supabase may fail to start if another project already owns port `54322`. The observed conflicting project id was `codex-spec2-database`; do not stop it without confirming ownership, or configure alternate Supabase ports first.

## Next N hours priorities

1. Generate and persist ad-group creatives: title, description, image prompt or asset.
2. Build fake deploy and story-driven monitoring dashboard.
3. Use the stored `human_reviews`, extraction outputs, ad groups, and simulated performance rows as the later Pioneer substrate.

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
