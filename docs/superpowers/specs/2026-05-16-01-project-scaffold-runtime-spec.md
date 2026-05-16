# Spec 01: Project Scaffold and Runtime

Date: 2026-05-16  
Owner: Worker A  
Status: Draft  
Phase: Foundation

## Problem / User Value

Motive needs a runnable app foundation before any extraction, review, creative, or monitoring work can land safely. The user value is demo velocity: a judge should be able to open one local URL, create or open a project shell, and understand the workflow path before the deeper AI features are implemented.

This scaffold must keep v1 OpenAI-first and independent from Pioneer. The foundation should make the happy path obvious: Intake -> Extraction/Review -> Creatives -> Monitoring.

All later implementation must reference `docs/superpowers/specs/SHARED_CONTRACT.md` for shared phase names, OpenAI Ads compatibility, KPI scoring, label vocabularies, and cross-spec ownership.

## Goals

- Boot a Next.js App Router app from `apps/web` with TypeScript, Tailwind, and a minimal workflow shell.
- Establish clear server/client boundaries for Supabase, Inngest, provider clients, and environment validation.
- Make local setup predictable with root workspace commands, `.env.example`, and documented provider optionality.
- Provide route and component structure that lets later workers add intake, extraction, HITL, creative, fake deploy, and monitoring features without moving the foundation.

## Scope

- Root monorepo setup with `package.json`, `pnpm-workspace.yaml`, and `apps/web/package.json`.
- Next.js App Router app under `apps/web/src/app`.
- TypeScript strict mode, path aliasing, Tailwind CSS, and a small component structure.
- Supabase browser, server, and service-role client utility boundaries.
- Inngest client, function registry location, and App Router route handler endpoint.
- Zod-backed env parsing in `apps/web/src/lib/env.ts`.
- Shared workflow navigation for Intake, Extraction/Review, Creatives, and Monitoring.
- Initial empty/loading/error states for the shell.
- Local dev commands and `.env.example` contract.

## Non-Goals

- No Pioneer integration, Pioneer inference, fine-tuning, Adaptive Inference, or GLiNER2 implementation in v1 scaffold.
- No real ad-platform deployment. Fake deploy belongs to later specs.
- No full auth product. Supabase Auth can be wired for future user sessions, but the hackathon demo can start with a single demo workspace.
- No enterprise multitenancy, billing, org administration, roles UI, or audit-log product surface.
- No full extraction pipeline implementation. This spec only reserves jobs/routes and runtime boundaries.

## Research Notes

- Next.js App Router official docs: root layouts require `html` and `body`, routes are file-system based, `loading.tsx` provides route-level loading UI, and Route Handlers live in `app/**/route.ts` using Web `Request`/`Response` APIs. Sources: [App Router docs](https://nextjs.org/docs/app), [installation](https://nextjs.org/docs/app/getting-started/installation), [layouts and pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages), [route handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers), Context7 `/vercel/next.js`.
- Next.js environment docs: `.env*` files are loaded by Next.js, browser-exposed variables must use `NEXT_PUBLIC_`, and `.env` files should not be committed. Source: [Next.js environment variables](https://nextjs.org/docs/15/app/guides/environment-variables).
- Supabase SSR docs: Next.js apps need browser and server clients; `@supabase/ssr` configures cookie-based SSR clients, and middleware/proxy can refresh sessions. Sources: [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [SSR overview](https://supabase.com/docs/guides/auth/server-side), Context7 `/supabase/supabase`.
- Supabase Realtime docs: Postgres changes require tables in the realtime publication and clients subscribe through `postgres_changes`; RLS still governs visible rows. Source: [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
- Supabase Storage docs: standard uploads through `supabase.storage.from(bucket).upload(path, file)` are enough for small hackathon context files; use unique paths rather than overwriting. Source: [Supabase Storage standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads).
- Supabase CLI/migration docs: local development should use `supabase init`, `supabase start`, migration files in `supabase/migrations`, `supabase db reset`, and `supabase/seed.sql` for seed data. Source: [Supabase local development with migrations](https://supabase.com/docs/guides/cli/local-development).
- Inngest Next.js docs: create a shared `Inngest` client, define functions with `createFunction`, serve them from `src/app/api/inngest/route.ts` using `serve({ client, functions })`, export `GET`, `POST`, and `PUT`, and send events with awaited `inngest.send()`. Sources: [Next.js quick start](https://www.inngest.com/docs/getting-started/nextjs-quick-start), [serving functions](https://www.inngest.com/docs/learn/serving-inngest-functions), [sending events](https://www.inngest.com/docs/events), Context7 `/inngest/website`.
- Inngest retries: functions and individual `step.run()` calls retry by default and can be configured; step code must be idempotent. Source: [Inngest retries](https://www.inngest.com/docs/features/inngest-functions/error-retries/retries).
- Tailwind CSS official docs: current Next.js setup uses `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `postcss.config.mjs`, and `@import "tailwindcss"` in `globals.css`. Source: [Install Tailwind CSS with Next.js](https://tailwindcss.com/docs/guides/nextjs).
- TypeScript strict mode docs: `strict` enables stronger type checking and may surface additional checks on future upgrades. Source: [TypeScript TSConfig `strict`](https://www.typescriptlang.org/tsconfig/strict.html).
- Zod docs: use schemas for runtime validation, `.safeParse()` for non-throwing validation, inferred types for shared contracts, and `z.toJSONSchema()` later for OpenAI structured-output schema generation. Sources: [Zod basics](https://zod.dev/basics), [Zod JSON Schema](https://zod.dev/json-schema).

## Proposed File Structure

```text
apps/web/
  package.json
  postcss.config.mjs
  next.config.ts
  tsconfig.json
  src/
    app/
      globals.css
      layout.tsx
      page.tsx
      loading.tsx
      error.tsx
      api/
        inngest/route.ts
        projects/[projectId]/extract/route.ts
        projects/[projectId]/creatives/route.ts
        projects/[projectId]/deploy/route.ts
      projects/[projectId]/
        layout.tsx
        page.tsx
        review/page.tsx
        creatives/page.tsx
        monitoring/page.tsx
    components/
      app-shell.tsx
      workflow-nav.tsx
      empty-state.tsx
      status-badge.tsx
    inngest/
      client.ts
      functions.ts
      extraction.ts
      creatives.ts
      monitoring.ts
    lib/
      env.ts
      supabase/
        browser.ts
        server.ts
        service-role.ts
      providers/
        openai.ts
        tavily.ts
        fal.ts
      motive/
        types.ts
        projects.ts
        extraction.ts
        reviews.ts
        creatives.ts
        deployments.ts
        performance.ts
```

Keep this structure lean. Empty placeholders are acceptable only when they prevent later route churn; avoid creating dead abstractions.

## Runtime Choices

- Package manager: `pnpm`, matching the plan and workspace layout.
- App framework: Next.js App Router with `src/app`.
- UI: React Server Components by default; Client Components only for forms, realtime subscriptions, optimistic review actions, and interactive controls.
- Styling: Tailwind CSS with one global stylesheet and small reusable components.
- Runtime validation: Zod for env validation and API payload validation.
- Background jobs: Inngest for extraction, creative, and monitoring jobs.
- Data/storage/realtime: Supabase Postgres, Auth-ready SSR clients, Realtime, and Storage.

## Dependencies

P0 app dependencies:

- `next`
- `react`
- `react-dom`
- `zod`
- `@supabase/supabase-js`
- `@supabase/ssr`
- `inngest`
- `lucide-react`

P0 dev/build dependencies:

- `typescript`
- `tailwindcss`
- `@tailwindcss/postcss`
- `postcss`
- `eslint`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `supabase`

P1 dependencies only when the consuming feature lands:

- `openai`
- Tavily SDK or thin fetch wrapper
- fal.ai SDK or thin fetch wrapper
- TanStack Query/Table if review tables need it; simple cards/tables are acceptable first.

## Environment Contract

Create `.env.example` at repo root or `apps/web/.env.example` and document where `next dev` expects the local copy. Do not commit `.env`.

Required for P0 boot:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Required once extraction jobs run:

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
OPENAI_EXTRACTION_PROMPT_VERSION=2026-05-16
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
INNGEST_DEV=1
```

Optional providers:

```text
TAVILY_API_KEY=
FAL_KEY=
MOTIVE_DEMO_MODE=true
```

Rules:

- `NEXT_PUBLIC_*` values may be read by browser code.
- `SUPABASE_SERVICE_ROLE_KEY`, provider API keys, `DATABASE_URL`, `INNGEST_EVENT_KEY`, and `INNGEST_SIGNING_KEY` are server-only.
- `apps/web/src/lib/env.ts` must expose two parsed objects: `serverEnv` and `clientEnv`.
- Env validation should fail fast in server routes/jobs and render a clear setup error in the shell if public Supabase config is missing.
- Optional provider keys should parse as optional and let the app fall back to seeded/demo paths.

## Supabase Boundaries

- `lib/supabase/browser.ts`: `createBrowserClient` for Client Components and Realtime subscriptions.
- `lib/supabase/server.ts`: `createServerClient` for Server Components, Server Actions, and Route Handlers using cookies.
- `lib/supabase/service-role.ts`: server-only admin client for Inngest functions that need to materialize extraction results, update phase status, or seed demo rows. It must never be imported from Client Components.
- Generated database types should be exported from `lib/motive/types.ts` or `lib/supabase/database.types.ts` after migrations exist.

For the hackathon shell, auth can be minimal. The schema should still be RLS-ready so later Auth does not require a rewrite.

## Inngest Boundaries

- `src/inngest/client.ts` exports `inngest = new Inngest({ id: "motive" })`.
- `src/inngest/functions.ts` exports the function list.
- `src/app/api/inngest/route.ts` serves the functions and exports `GET`, `POST`, and `PUT`.
- App route handlers trigger jobs by awaiting `inngest.send()`.
- Inngest step names should be stable and human-readable, for example `extract-source-recap`, `persist-brand-features`, `publish-phase-complete`.
- Every mutating step must be idempotent by `project_id`, `phase`, and, where relevant, `run_id`.

Reserved event names:

```text
motive/project.created
motive/extraction.requested
motive/creatives.requested
motive/deployment.fake_requested
motive/monitoring.requested
```

## Route / Layout Structure

- `/`: Intake. Brand URL and optional context entry point.
- `/projects/[projectId]`: Project overview redirect or lightweight status page.
- `/projects/[projectId]/review`: Extraction/Review workspace. The nav label should read `Extraction / Review`.
- `/projects/[projectId]/creatives`: Ad groups and creative variants.
- `/projects/[projectId]/monitoring`: Fake deploy state and story-driven KPI dashboard.
- `/api/inngest`: Inngest serve endpoint.
- `/api/projects/[projectId]/extract`: starts extraction jobs.
- `/api/projects/[projectId]/creatives`: starts creative jobs.
- `/api/projects/[projectId]/deploy`: writes fake deployment and starts monitoring synthesis.

Root layout owns app-wide fonts, metadata, and global CSS. Project layout owns workflow navigation and project-level status.

## Shared Workflow Navigation

Navigation items:

1. Intake
2. Extraction / Review
3. Creatives
4. Monitoring

States:

- `available`: route can be opened.
- `current`: active route.
- `blocked`: prerequisite rows are missing.
- `complete`: enough rows exist for the next step.
- `failed`: most recent phase/job failed.

The shell should not hide unavailable steps. Disabled/blocked states are part of the demo story because they show the workflow.

## Data Model Touched

This scaffold should not define the schema; Spec 02 owns that. It must reserve TypeScript boundaries for:

- `Project`
- `Source`
- `ExtractionRun`
- `ReviewableEntity`
- `AdGroup`
- `CreativeVariant`
- `Deployment`
- `PerformanceSnapshot`

The shell may use temporary local types until generated Supabase types exist, but later implementation should replace them with generated database types plus Zod schemas.

## API / Server Boundaries

- Server Components read initial project state from Supabase.
- Route Handlers validate inputs with Zod and send Inngest events.
- Client Components submit forms, subscribe to Realtime, and perform HITL interactions only through Route Handlers or Server Actions.
- Provider calls must stay in `lib/providers/*` or Inngest functions, never in UI components.
- Server-only modules should be named clearly and use `server-only` where practical.

## UI States and Interactions

P0 shell states:

- Empty intake: URL field, optional context textarea, disabled submit while invalid.
- Project loading: route-level skeleton using `loading.tsx`, not a full-screen spinner.
- Project missing: clear not-found style state with a path back to Intake.
- Provider setup missing: compact setup error with missing env keys.
- Workflow blocked: Creatives and Monitoring visible but marked blocked until prior rows exist.
- Extraction pending: Review page has phase rail placeholders and empty panels.
- Job failed: failed status badge and retry CTA placeholder.

The first screen should be the usable intake/workbench, not a marketing landing page.

## Background Jobs / Realtime Expectations

Spec 01 only wires the runtime. Later specs implement the actual jobs.

Foundation requirements:

- Inngest endpoint reachable at `/api/inngest`.
- App can send `motive/extraction.requested` without doing long-running work in the request.
- Realtime client utilities are available for Client Components to subscribe to project-scoped rows.
- The Review page has stable UI slots for phase rail and progressive panels, so later extraction work can stream rows without redesign.

## Failure States

- Missing public Supabase env: app renders setup error and does not attempt Supabase calls.
- Missing server-only provider env: route/job returns typed error or falls back to demo mode when provider is optional.
- Inngest endpoint unavailable: API returns a recoverable error and the UI shows "job could not start".
- Supabase connection error: shell shows project load failure with retry.
- Realtime disconnected: Review page keeps the last loaded rows and displays a reconnecting badge.
- Invalid route param: 404-like project state, not a runtime crash.

## Local Dev Commands

Root scripts:

```sh
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm db:start
pnpm db:reset
pnpm inngest:dev
```

Expected mappings:

```text
pnpm dev        -> pnpm --filter web dev
pnpm build      -> pnpm --filter web build
pnpm lint       -> pnpm --filter web lint
pnpm typecheck  -> pnpm --filter web typecheck
pnpm db:start   -> supabase start
pnpm db:reset   -> supabase db reset
pnpm inngest:dev -> inngest-cli dev -u http://localhost:3000/api/inngest
```

The first acceptance target is local boot, not production deployment.

## Acceptance Criteria

- `apps/web` exists and boots locally with `pnpm dev`.
- Root workspace scripts can run the web app without `cd apps/web`.
- TypeScript strict mode is enabled.
- Tailwind styles load from `globals.css`.
- App Router root layout, project layout, route-level loading UI, and route-level error UI exist.
- The first screen is Intake, not a marketing page.
- The workflow navigation shows Intake, Extraction/Review, Creatives, and Monitoring.
- Env validation reports missing required values clearly.
- Supabase browser/server/service-role client boundaries exist and keep service-role access server-only.
- Inngest client and `/api/inngest` route handler exist with `GET`, `POST`, and `PUT`.
- A placeholder extraction route can validate input and send an Inngest event without blocking on extraction work.

## Demo Script

1. Start Supabase locally with `pnpm db:start`.
2. Start the Next.js app with `pnpm dev`.
3. Start Inngest Dev Server with `pnpm inngest:dev`.
4. Open `http://localhost:3000`.
5. Confirm the Intake screen appears with brand URL and optional context inputs.
6. Create or open a demo project.
7. Confirm the project shell shows Intake, Extraction/Review, Creatives, and Monitoring.
8. Navigate to Review and confirm the empty phase rail/panels are ready for progressive extraction.
9. Trigger the placeholder extraction route and confirm the request returns quickly with a queued status.

## Open Questions / Risks

- Decide whether `.env.example` lives only at repo root or also under `apps/web`. Root is simpler for workspace commands; app-local may be clearer for Next.js users.
- Confirm the exact Node.js version to pin in `docs/agent-memory/VERSIONS.md`; Next.js current docs require modern Node and the project should avoid ambiguous "latest" infrastructure tags.
- Decide whether the demo uses Supabase Auth anonymous users or a single seeded demo user. Spec 02 should make either path possible.
- Inngest Cloud keys are not needed for local-only demo mode, but the endpoint should be production-compatible if deployment happens.
- If workers add routes before the scaffold lands, preserve their route files and fit the shared nav around them rather than overwriting.
