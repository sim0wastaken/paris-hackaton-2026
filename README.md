# Motive — Paris AI Hackathon 2026

Motive is an intent infrastructure demo for AI-native acquisition. It ingests a brand link and extra context, streams OpenAI extraction results into a HITL workspace, persists every artifact, generates ad-group creatives, and shows a story-driven monitoring dashboard.

## Hackathon Thesis

OpenAI powers the first complete product loop. Tavily can gather web context, fal.ai can render creative assets, and Pioneer becomes the later specialist classifier once Motive has stored enough OpenAI labels, HITL corrections, and performance rows.

The demo-day artifact is a persisted workflow: brand link -> streaming extraction -> live HITL validation -> ad groups -> title/description/image or video creatives -> fake deploy -> story-driven monitoring dashboard.

The Pioneer narrative is deliberately downstream: every validated row becomes future training data for a smaller classifier that can replace repeated GPT labeling calls and eventually improve from campaign outcomes.

## Core Brief

Read [`docs/briefing-files/motive-openai-first-hackathon-plan.md`](docs/briefing-files/motive-openai-first-hackathon-plan.md) first. It is the authoritative product and architecture brief for the current hackathon build.

## Current Artifact

- Runnable app scaffold: `apps/web`
- Landing prototype: `Motive - Landing + SaaS (4)/Motive Landing.html`
- Architecture sketch: `parishack.excalidraw`
- Hackathon strategy: `docs/Hackathon-Briefs/PROJECT_STRATEGY.md`
- Implementation plan: `docs/superpowers/plans/2026-05-16-openai-first-demo-plan.md`
- Source hackathon docs: `docs/Hackathon-Briefs/`
- Operational notes: `RUNBOOK.md`, `CLAUDE.md`, `docs/agent-memory/`

## Local App

```sh
npx pnpm@11.1.2 install
npx pnpm@11.1.2 dev
```

Open `http://localhost:3000`. The scaffold currently provides the intake shell, demo project workspace, review phase rail, provider/env boundaries, Supabase client boundaries, and Inngest route/job registration.

## Demo Acceptance

The demo is credible when a user can create a brand project, watch extraction phases land into the review page, approve/edit generated ad-group ideas, create persisted creatives, fake deploy them, and inspect a monitoring dashboard whose KPIs tell a coherent performance story.
