# AGENTS

This file mirrors the GitNexus MUST/NEVER rules so non-Claude agents that honour `AGENTS.md` get the same rules. The identical block is embedded inside `CLAUDE.md`.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **paris-hackaton-2026** (<N> symbols, <M> relationships, <K> execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index not yet generated. Run `npx gitnexus analyze` at repo root, then fill the `<N>/<M>/<K>` stats from `.gitnexus/meta.json` here and in `CLAUDE.md`.
> If any GitNexus tool warns the index is stale, re-run `npx gitnexus analyze` first.

## Always Do
- **MUST run impact analysis before editing any symbol.** Run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report blast radius to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify scope.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk.
- Use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping.
- Use `gitnexus_context({name: "symbolName"})` for full symbol context.

## Never Do
- NEVER edit a function/class/method without running `gitnexus_impact` on it first.
- NEVER ignore HIGH or CRITICAL risk warnings.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename`.
- NEVER commit without running `gitnexus_detect_changes()`.

## Resources
| Resource | Use for |
|----------|---------|
| `gitnexus://repo/paris-hackaton-2026/context`   | Codebase overview, check index freshness |
| `gitnexus://repo/paris-hackaton-2026/clusters`  | All functional areas |
| `gitnexus://repo/paris-hackaton-2026/processes` | All execution flows |
| `gitnexus://repo/paris-hackaton-2026/process/{name}` | Step-by-step execution trace |

## CLI
| Task | Read this skill file |
|------|---------------------|
| "How does X work?"           | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| "Why is X failing?"          | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / refactor  | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, schema reference      | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index / status / wiki CLI    | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
<!-- gitnexus:end -->
