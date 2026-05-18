# Quality score — per-domain grade card

Per-domain grade across five dimensions. Maintained by the `/grade` slash command (re-runs every grading pass) and surfaced by `/gc`. Goal: at-a-glance picture of where the tech debt is.

**Grading scale:** A (production-ready) · B (covered, minor gaps) · C (works, gaps exist) · D (functional but fragile) · F (missing).

**Dimensions:**
- **Tests** — co-located test coverage on the service / data layer.
- **Schema** — Zod schemas at every boundary (HTTP body, event payload, OpenAI / fal response).
- **Errors** — typed errors, no silent catches, errors logged with `request_id`.
- **Obs** — structured logs with `request_id`; Inngest events traceable end-to-end.
- **Legibility** — files under 400 lines, clear naming, docs reference recent file paths.

| Domain | Tests | Schema | Errors | Obs | Legibility | Notes |
|---|:-:|:-:|:-:|:-:|:-:|---|
| Projects | F | B | C | C | C | `projects.ts` 509 lines, **no test** — top priority |
| Sources / Intake | F | C | D | C | B | `source-ingestion.ts` 86 lines, no test; Tavily path deferred (`post-hackathon/`) |
| Extraction | B | A | B | B | C | `extraction.ts` 876 lines — split candidate; tests cover happy paths |
| Ad groups | B | A | B | C | C | `ad-groups.ts` 801 lines — over the 400-line cap |
| Creatives | B | A | B | C | D | `creatives.ts` 1020 lines — split into `-generation` + `-review` |
| Reviews | B | A | B | C | A | `reviews.ts` 222 lines, well-scoped, well-tested |
| Deployments | B | B | B | C | B | `deployments.ts` 496 lines — minor split candidate |
| Performance / KPIs | F | C | C | D | C | `performance.ts` 658 lines, **no test**; deterministic seeding to verify |
| Demo / Reset | B | C | B | C | D | `demo.ts` 1089 lines — biggest legibility hit in the repo |
| Project explorer | B | B | B | C | A | 175 lines, tightly scoped |

## Open issues this grade surfaces

1. **Three domains have no tests at all:** `projects`, `source-ingestion`, `performance`. Adds 3 entries to `tech-debt-tracker.md`.
2. **Four files exceed the 400-line legibility cap:** `creatives.ts`, `demo.ts`, `extraction.ts`, `ad-groups.ts`. `/gc` will open split PRs.
3. **Observability is uniformly mid (C):** no domain yet threads `request_id` end-to-end through Inngest. See `RELIABILITY.md` Invariant 1 + 10.
4. **Error-handling discipline is uneven:** schemas catch bad inputs, but downstream catches (e.g. OpenAI 5xx → retry) are inconsistent.

## How to re-grade

Run `/grade`. It will:
1. Walk the file inventory and recompute legibility (line counts, file split candidates).
2. Check for co-located tests on each service / actions file.
3. Spot-check schema usage (look for `as` casts at HTTP / event boundaries).
4. Diff against the previous version of this file and report movement.

The grading is opinionated and rough — a B vs C on Errors is a judgment call. The goal is to surface the worst gaps, not to be a scientific metric.
