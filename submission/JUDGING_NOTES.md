# Judging Notes

## Creativity

Motive reframes ad generation as an auditable workflow. The product does not stop at "generate copy"; it builds a reviewable campaign substrate, captures human corrections, and turns monitoring into a feedback signal.

The creative idea is the loop:

```text
source context -> model interpretation -> human correction -> campaign asset -> performance story -> future model training data
```

## Technical Complexity

The project includes:

- Next.js app router API and UI surfaces.
- Supabase Postgres schema with enums, indexes, RLS, and review RPC.
- Background orchestration through Inngest.
- Provider boundaries for OpenAI and fal.ai.
- Persisted prompt inputs, model outputs, usage metadata, and errors.
- Human-in-the-loop review actions with before/after audit storage.
- Deterministic seeded mode for reliable judging.
- Fake deploy and generated monitoring snapshots.

## Partner Technology Usage

OpenAI is used as the main workflow engine for extraction, generation, and monitoring synthesis. This satisfies the partner-technology requirement and is central to the product.

fal.ai is wired as an optional creative media provider. Tavily and Pioneer are described honestly as near-term extensions rather than exaggerated current dependencies.

## What A Judge Should Inspect

- `apps/web/src/app/api/projects/route.ts` for project creation.
- `apps/web/src/inngest/` for background workflow functions.
- `apps/web/src/lib/motive/extraction.ts` and related modules for extraction behavior.
- `apps/web/src/lib/motive/ad-groups.ts` for ad-group generation.
- `apps/web/src/lib/motive/creatives.ts` for creative generation.
- `apps/web/src/lib/motive/deployments.ts` for fake deploy and monitoring story.
- `supabase/migrations/` for persistence and review-audit design.
- `submission/` for the judge-facing documentation packet.

## Known Limitations

- Real ad-platform deployment is intentionally out of scope.
- Production authentication is not the demo focus.
- Tavily crawling is not in the current live path.
- Pioneer training is deferred until enough validated data exists.
- Hosted reset should remain guarded by demo-mode/token configuration.

## Evaluation Claim

Motive is a complete hackathon artifact because the user can move from raw brand context to reviewed campaign intelligence, creative variants, fake deployment, and monitoring without leaving the product.
