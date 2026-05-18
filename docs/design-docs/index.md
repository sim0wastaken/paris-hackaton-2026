# Design docs — index

Files in this directory describe **how the agent should operate**, distilled into focused documents. They are the source of truth for behavior; specs in `docs/superpowers/specs/` describe what to build.

| File | Status | Purpose |
|---|---|---|
| `core-beliefs.md` | Live | Distilled non-negotiables and operating principles. Read at session start. |
| `golden-principles.md` | Live | Mechanical rules the doc-gardening agent enforces. Each rule has a rationale and a remediation. |

## When to add a new design doc

Add one when:
- A pattern emerges from human-feedback corrections that should apply repo-wide.
- A non-negotiable in `CLAUDE.md` needs more than two paragraphs to explain.
- An invariant in `RELIABILITY.md` needs prose justification beyond what fits there.

Each new doc gets:
1. A row in this index with a one-line purpose and status (`Live` / `Draft` / `Deprecated`).
2. A link from `AGENTS.md` if it belongs in the agent's first-pass map.
3. A test or linter if it can be mechanically enforced.

## When to remove a design doc

When the rule it documents is fully encoded in a linter or test. At that point the doc becomes redundant with the lint message — mark it `Deprecated` in this index, keep the file for one release for searchability, then delete.
