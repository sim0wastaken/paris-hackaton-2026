# Demo Script

## Two-Minute Video Demo

### 0:00-0:15 - Problem And Product

"Motive turns a brand link into an auditable AI acquisition workflow. Instead of generating ad copy in isolation, it stores the source material, campaign intelligence, human corrections, creatives, and monitoring signal in one loop."

Show:

- Landing/intake screen.
- Brand URL and context fields.

### 0:15-0:40 - Intake And Extraction

"I add a brand URL and context. Motive creates a project, saves the sources, and starts OpenAI extraction phases. The review workspace opens immediately so the user is not waiting on a blank spinner."

Show:

- Submit intake.
- Project workspace navigation.
- Extraction/review phase rail.

### 0:40-1:05 - Human Review

"The model output is not treated as final. Features, buying conversations, intent labels, and landing gaps become reviewable rows. I can approve, edit, reject, or enrich each one, and Motive stores before-and-after review records."

Show:

- Feature/conversation/gap panels.
- One approve action.
- One edit action.

### 1:05-1:25 - Ad Groups And Creatives

"Approved rows become campaign-ready ad groups. Then Motive generates creative variants with title, description, angle, target URL, and an asset prompt. If fal.ai is configured, the media path can generate assets; otherwise the prompt is still persisted."

Show:

- Generate ad groups.
- Creatives page.
- Creative cards.

### 1:25-1:45 - Fake Deploy And Monitoring

"The deploy step is intentionally fake for the hackathon, but it produces an ad-platform-shaped package and simulated KPI snapshots. The monitoring dashboard tells a quality story tied to the actual creative and landing-page gaps."

Show:

- Deploy action.
- Monitoring dashboard with KPIs and insights.

### 1:45-2:00 - Why It Matters

"OpenAI powers the full workflow today. The durable outputs and human corrections become the future dataset for a smaller Pioneer classifier, so the system can get faster and cheaper as it learns."

Show:

- Submission docs or architecture diagram.
- Final monitoring view.

## Five-Minute Finalist Live Demo

1. Start with the outcome: Motive creates a reviewable campaign substrate from a URL.
2. Use the seeded demo project for reliability.
3. Walk through Review first, because it shows the core AI + human loop.
4. Perform one edit so the audit trail is visible.
5. Generate or show ad groups.
6. Generate or show creative variants.
7. Fake deploy.
8. End on monitoring and the Pioneer training-data story.

## Backup Plan

If provider latency or keys fail:

- Use `DEMO_MODE=seeded`.
- Run `npx pnpm@11.1.2 demo:reset`.
- Start from the deterministic demo project.
- Explain that seeded mode exists so judges can inspect the complete product loop without waiting on external providers.
