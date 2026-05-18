# SECURITY — Motive

What is sensitive, where it lives, what is never logged. Read this before touching env vars, auth, or anything that crosses the browser/server boundary.

---

## Sensitive material inventory

| Asset | Where it lives | Where it must never appear |
|---|---|---|
| `OPENAI_API_KEY` | `.env` (local), Vercel env (deployed) | client bundles, logs, error messages, screenshots |
| `FAL_KEY` | `.env`, Vercel env | client bundles, logs |
| `TAVILY_API_KEY` | `.env`, Vercel env | client bundles, logs |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env`, Vercel env (server-only) | **any** client code, any browser-reachable response, any non-server log |
| `SUPABASE_ANON_KEY` | `.env`, `NEXT_PUBLIC_*` (browser ok) | not sensitive — public by design |
| `MOTIVE_OPERATOR_TOKEN` | `.env`, Vercel env | client bundles, logs |
| `INNGEST_SIGNING_KEY` / `INNGEST_EVENT_KEY` | `.env`, Vercel env | client bundles, logs |
| User-pasted brand URLs | DB column `sources.url` | logs at info level (debug-level OK with `request_id` only) |
| Provider request/response bodies | `extraction_runs.provider_payload`, etc. | non-server logs |

Source-of-truth placeholders: `.env.example` is committed with sentinel values. Real `.env` is **gitignored** (verified in `.gitignore`).

---

## Server / client boundary

Two rules, mechanically enforced (or to-be-enforced):

1. **`process.env.<KEY>` outside `NEXT_PUBLIC_*` may only be read from server code.** Server code = files under `app/api/`, `app/**/page.tsx` (server component), `lib/motive/`, `lib/supabase/server.ts`, `inngest/`. Files under `components/` are client by default unless a `"use server"` directive applies.
2. **Service-role Supabase client is server-only.** It is constructed in `lib/supabase/admin.ts` (or equivalent) and never exported through a barrel that a client can import.

If you need a previously-server-only value on the client, the answer is almost always "expose a route handler" — not "promote it to `NEXT_PUBLIC_*`."

---

## Logging policy

Per `RELIABILITY.md` Invariant 8: structured logs only. Redaction rules:

- **Never log:** any API key, the operator token, the service-role key, full email addresses, full URLs of user-supplied brand pages (log only the hostname + path length).
- **OK to log:** `request_id`, `project_id`, table name, row count, status code, error class name, error message after redaction.
- **`provider_payload`** fields persisted to Supabase are encrypted at rest by the host and never logged. Do not echo them back through API responses.

A helper `lib/motive/log.ts` (Pillar 3 of the harness plan) wraps `console` with redaction; the `no-unstructured-log` ESLint rule will enforce it.

---

## Auth & RLS

- All 14 core tables have RLS enabled (verified in migration 01).
- Client code uses the anon key + `@supabase/ssr` for session-cookie auth (matches `vercel:auth` patterns).
- Server-side privileged operations (demo reset, seed, admin endpoints) use the service-role client — gated by `MOTIVE_OPERATOR_TOKEN` checks at the route handler.
- Inngest webhook signature verification uses `INNGEST_SIGNING_KEY`. The signed webhook is the only path through which Inngest events enter the app.

---

## Demo / operator endpoints

`app/api/demo/reset` is the only route that calls the service-role client from a public path. It requires the `MOTIVE_OPERATOR_TOKEN` header. If you add another operator-only route:

- Check the token first thing in the handler.
- Return `401` (not `403`) on mismatch — `403` would imply the token was recognized.
- Never log the submitted token, even on mismatch.

---

## Dependency / supply chain

- `pnpm` with `packageManager` pinned (`pnpm@11.1.2`).
- `onlyBuiltDependencies` in root `package.json` limits which packages can run install scripts.
- Lockfile (`pnpm-lock.yaml`) is committed; CI runs `pnpm install --frozen-lockfile`.
- When adding a new dep, prefer the smallest reasonable footprint. Reimplement before pulling in `lodash-style` utility packages — keeps the agent's mental model intact and avoids opaque upstream behavior.

---

## What never crosses the wire to the browser

- Service-role Supabase key
- OpenAI / fal.ai / Tavily / Inngest secrets
- Operator token
- Internal IDs that are not `project_id` (e.g. `extraction_run_id`) — fine; not a secret, just keep responses lean
- `provider_payload` JSON from extractions or creatives unless explicitly opted-in by an authenticated route

---

## Reporting / rotation

See `docs/agent-memory/SECRETS.md` for the rotation procedure. If a key is suspected leaked: rotate at the provider first, then update `.env` and Vercel env in parallel; never the other way around.
