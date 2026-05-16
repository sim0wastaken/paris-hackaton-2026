# RUNBOOK — paris-hackaton-2026

## TL;DR

- Product direction is locked around an OpenAI-first, persisted campaign workflow.
- Authoritative brief: `docs/briefing-files/motive-openai-first-hackathon-plan.md`.
- Demo goal: brand link + context -> streaming OpenAI extraction -> live HITL review -> ad groups -> creatives -> fake deploy -> story-driven monitoring dashboard.

## What runs

| Service / process | Cmd | Port | Notes |
|-------------------|-----|------|-------|
| _TBD_ |  |  |  |

## How to bring it up

```sh
# TBD — populate when a Makefile / package.json / equivalent lands.
```

## Live-verified golden path

_None yet — nothing to run._

## What is stubbed

| Stub | Where | Cross-ref | Lift when |
|------|-------|-----------|-----------|
| GitNexus index | `.gitnexus/` not generated | CLAUDE.md GitNexus block | Run `npx gitnexus analyze` |
| GitNexus skill files | `.claude/skills/gitnexus/*/SKILL.md` missing | CLAUDE.md CLI table | Copy from official skill pack |
| MCP servers | Configured at harness, not in-repo | Spec §7.1 | Provision gitnexus, context7, github, chrome-devtools, playwright, sourcegraph |
| First plan | `docs/superpowers/plans/2026-05-16-openai-first-demo-plan.md` | Spec §10 step 11 | Execute task-by-task |
| Real ad-platform deployment | Fake deploy only | OpenAI-first hackathon plan | After demo workflow works |
| Pioneer classifier / retraining | Deferred out of critical path | OpenAI-first hackathon plan | After stored extraction + HITL data exists |

## Known issues

_None._

## Next N hours priorities

1. Scaffold backend, frontend, database, CRUD APIs, env wiring, and provider clients.
2. Define the schema for projects, sources, extraction runs, brand features, conversations, landing gaps, ad groups, creative variants, reviews, deployments, and performance snapshots.
3. Build OpenAI extraction phases and persist every input/output.
4. Build HITL review pages for validating extracted ideas and proposed ad groups.
5. Generate and persist ad-group creatives: title, description, image/video prompt or asset.
6. Build fake deploy and story-driven monitoring dashboard.
7. Use Supabase Realtime + Inngest/background jobs so extraction phases appear progressively in HITL instead of behind a spinner.
8. Run `npx gitnexus analyze`; fill stats into `CLAUDE.md` + `AGENTS.md` GitNexus blocks; add `.gitnexus/meta.json` to commit.

## Pointers (compaction-survive)

Read in order:
1. `CLAUDE.md`
2. `docs/agent-memory/PROGRESS.md`
3. `docs/agent-memory/BLOCKERS.md`
4. `docs/briefing-files/index.md`
5. `docs/briefing-files/motive-openai-first-hackathon-plan.md`
6. `docs/superpowers/plans/2026-05-16-openai-first-demo-plan.md`

## Acceptance contract

No test command is defined yet. The product acceptance contract is:

- User can create a project from a URL and optional context files.
- OpenAI extraction persists source recap, feature map, conversations, landing gaps, and ad-group ideas.
- HITL pages support approving/editing/rejecting extracted ideas.
- Creative generation persists title, description, and image/video prompt or asset per ad group.
- Fake deploy and story-driven monitoring dashboard complete the demo loop.
- Extraction UX is progressive: recap, features, conversations, intents/stages, landing gaps, and ad groups appear as each phase completes.

## Deployment target

_TBD — name one (e.g. "GCP Cloud Run, eu-west", "Fly.io global"). See spec §17.10._
