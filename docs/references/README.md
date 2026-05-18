# References — cached library docs (llms.txt-style)

In-repo cheatsheets for libraries Motive depends on. Read these **first** when answering a "how does X work" question about an external library — they are scoped to the APIs we actually touch.

If the answer isn't here, fall back to Context7 (`mcp__plugin_context7_context7__query-docs`). Web search only if Context7 has no entry. (`CLAUDE.md` non-negotiable #8.)

| File | Library | Version pinned in repo |
|---|---|---|
| `nextjs-llms.txt` | Next.js 16 App Router | `next@16.2.6` |
| `supabase-llms.txt` | Supabase SSR + supabase-js | `@supabase/ssr@0.10.3`, `@supabase/supabase-js@2.105.4` |
| `inngest-llms.txt` | Inngest event queue + functions | `inngest@4.4.0`, `inngest-cli@1.19.4` |
| `openai-responses-llms.txt` | OpenAI Responses API (HTTP, no SDK) | — |
| `fal-llms.txt` | fal.ai client | `@fal-ai/client@1.10.1` |
| `tavily-llms.txt` | Tavily Map + Extract (HTTP, no SDK) | — |
| `zod-llms.txt` | Zod schemas | `zod@4.4.3` |

## Maintenance

When a library version in this repo changes, update the corresponding file's "Version" header in the same commit. The `/gc` doc-gardening agent flags drift between this README and `package.json`.

These files are short on purpose — exhaustive API references belong in Context7. The local cheatsheet covers the 5–10 calls we actually make.
