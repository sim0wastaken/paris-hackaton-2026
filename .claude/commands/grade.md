---
description: Re-grade docs/QUALITY_SCORE.md based on the current state of the repo.
---

# /grade — refresh the per-domain quality grade

Walk the codebase and recompute `docs/QUALITY_SCORE.md`. Output a diff against the current file and write the new version.

## Grading dimensions

For each domain (rows in `QUALITY_SCORE.md` — currently 10), grade A through F on:

- **Tests** — does every `*.ts` in this domain have a co-located `*.test.ts`? Are key paths covered?
- **Schema** — is every boundary (HTTP body, Inngest event, OpenAI / fal response) parsed with a Zod schema? Any `as` casts at boundaries?
- **Errors** — typed errors? No silent catches? Errors logged with `request_id` via `log.error`?
- **Obs** — structured logging via `lib/motive/log.ts`? `request_id` threaded?
- **Legibility** — files under 400 lines? Domain name matches file name? Comments only when WHY is non-obvious?

Grading scale (same as the file): A (production-ready) · B (covered, minor gaps) · C (works, gaps exist) · D (functional but fragile) · F (missing).

## How to grade

1. Run `pnpm lint` once at the start — collect the violation counts per file.
2. Inventory `apps/web/src/lib/motive/*.ts` — for each file, look at line count, presence of `*.test.ts`, presence of `log.*`, presence of `requestId` parameters, presence of any `as` casts.
3. Spot-check one route handler per domain in `apps/web/src/app/api/` — does it call the matching `lib/motive/<domain>.ts`?

## Output

1. Print the proposed new table to the conversation.
2. List the deltas vs. the current `QUALITY_SCORE.md` (e.g. "Performance: F → D — tests added but still no schema parsing").
3. Append a 3–5 line **Open issues this grade surfaces** section, refreshed from the new numbers.
4. Write the result to `docs/QUALITY_SCORE.md`.
5. Add a one-line entry to `docs/agent-memory/PROGRESS.md`: `- [<date>] DONE re-graded QUALITY_SCORE.md (changes: A→B in N domains, regressions: M)`.

If grades move backward (B → C or worse), flag those as candidates for `tech-debt-tracker.md` entries.
