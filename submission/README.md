# Motive Submission Packet

Motive is an intent infrastructure demo for AI-native acquisition. It turns a brand URL and extra context into a persisted campaign workflow: OpenAI extraction, human review, ad-group generation, creative generation, fake deployment, and a story-driven monitoring dashboard.

## Submission Summary

| Field | Value |
|---|---|
| Project name | Motive |
| Hackathon | {Tech: Europe} Paris AI Hackathon 2026 |
| Track | Open Innovation |
| Primary partner technology used | OpenAI |
| Additional partner integrations | fal.ai creative asset path is implemented when `FAL_KEY` is configured. Tavily and Pioneer are documented as next-layer extensions, not critical-path demo dependencies. |
| Repository requirement | Public GitHub repository with source, setup, APIs, architecture, and evaluation docs |
| Demo requirement | 2-minute video demo plus live walkthrough capability |

## What The Demo Shows

1. Create a project from a brand URL and optional context.
2. Route immediately into the review workspace while extraction phases progress.
3. Persist source recap, feature map, conversations, intent/stage labels, landing gaps, and ad-group proposals.
4. Approve, edit, reject, or enrich extracted rows with an auditable human-review trail.
5. Generate campaign/ad-group structures and creative variants.
6. Fake deploy approved creatives into an OpenAI Ads-shaped package.
7. Inspect monitoring snapshots whose KPI story is tied to the quality of the approved ad groups and creatives.

## Documentation Index

- [SETUP_AND_INSTALLATION.md](SETUP_AND_INSTALLATION.md) - local setup, environment variables, verification commands, and seeded demo path.
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - problem, solution, user flow, judging narrative, and scope boundaries.
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - system architecture, data model, runtime flow, safety, and persistence choices.
- [API_REFERENCE.md](API_REFERENCE.md) - HTTP endpoints, request/response intent, and operational notes.
- [PARTNER_TECHNOLOGIES.md](PARTNER_TECHNOLOGIES.md) - OpenAI, fal.ai, Tavily, and Pioneer usage boundaries.
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) - 2-minute video script and 5-minute finalist live-demo structure.
- [JUDGING_NOTES.md](JUDGING_NOTES.md) - creativity, technical complexity, partner-tech usage, and limitations.
- [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) - final pre-submit checklist mapped to the hackathon manual.

## Quick Start

```sh
npx pnpm@11.1.2 install
cp .env.example .env.local
npx pnpm@11.1.2 dev
```

Open `http://localhost:3000`.

For the deterministic demo path:

```sh
DEMO_MODE=seeded ENABLE_DEMO_RESET=true npx pnpm@11.1.2 dev
npx pnpm@11.1.2 inngest:dev
npx pnpm@11.1.2 demo:reset
```

Then open `/`, select the demo project, and walk through Review, Creatives, and Monitoring.
