# Setup And Installation

## Prerequisites

- Node.js compatible with Next.js 16.
- pnpm 11.1.2, invoked through `npx pnpm@11.1.2`.
- Docker if running the local Supabase stack.
- Supabase CLI through the repository script.
- OpenAI API key for the live AI path.
- Optional `FAL_KEY` for generated creative image assets.

## Install

```sh
npx pnpm@11.1.2 install
cp .env.example .env.local
```

The app is a pnpm workspace. The main demo app is `apps/web`.

## Environment Variables

Required for the normal local stack:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL. Local default is `http://127.0.0.1:54321`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase writes and demo reset operations. |
| `DATABASE_URL` | Postgres connection string. Local default targets Supabase DB port `54322`. |
| `NEXT_PUBLIC_APP_URL` | App origin, usually `http://localhost:3000`. |

AI and orchestration:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Enables live OpenAI extraction, ad-group generation, creative text, and monitoring synthesis. |
| `OPENAI_MODEL` | Default model for generation. `.env.example` uses `gpt-5.5`. |
| `OPENAI_REASONING_EFFORT` | Optional reasoning-effort control. |
| `OPENAI_EXTRACTION_MODEL` | Optional extraction-specific model override. |
| `OPENAI_EXTRACTION_PROMPT_VERSION` | Prompt-version value stored on `extraction_runs`. |
| `INNGEST_EVENT_KEY` | Inngest event key for hosted usage. |
| `INNGEST_SIGNING_KEY` | Inngest signing key for hosted usage. |
| `INNGEST_DEV` | Set to `1` for local development. |

Demo and optional providers:

| Variable | Purpose |
|---|---|
| `DEMO_MODE` | `live`, `seeded`, or `auto`. `auto` falls back to fixtures when providers are missing. |
| `ENABLE_DEMO_RESET` | Enables the reset endpoint/script. |
| `DEMO_PROJECT_ID` | Deterministic seeded project ID. |
| `DEMO_SEED_VERSION` | Version marker stored with seeded data. |
| `DEMO_OPERATOR_TOKEN` | Optional hosted reset guard. |
| `FAL_KEY` | Enables fal.ai creative image generation. |
| `TAVILY_API_KEY` | Reserved for Tavily source-ingestion upgrade. |
| `PIONEER_API_KEY` | Reserved for post-v1 Pioneer classifier work. |

## Start Local Services

App only:

```sh
npx pnpm@11.1.2 dev
```

Supabase local stack:

```sh
npx pnpm@11.1.2 db:start
npx pnpm@11.1.2 db:reset
```

Inngest dev server:

```sh
npx pnpm@11.1.2 inngest:dev
```

Open `http://localhost:3000`.

## Deterministic Seeded Demo

Use this path when API keys are unavailable or the live provider path is too slow for a judging slot.

```sh
DEMO_MODE=seeded ENABLE_DEMO_RESET=true npx pnpm@11.1.2 dev
npx pnpm@11.1.2 inngest:dev
npx pnpm@11.1.2 demo:reset
```

Then open `/`, choose the demo project, and navigate through:

1. Intake
2. Extraction / Review
3. Creatives
4. Monitoring

Seeded demo protections:

- Reset uses only `DEMO_PROJECT_ID`.
- Hosted reset requires `ENABLE_DEMO_RESET=true` and demo mode or `DEMO_OPERATOR_TOKEN`.
- `DEMO_MODE=seeded` skips live OpenAI and fal.ai calls.
- `DEMO_MODE=auto` uses deterministic fixtures if providers are not configured.

## Verification

```sh
npx pnpm@11.1.2 test
npx pnpm@11.1.2 typecheck
npx pnpm@11.1.2 lint
npx pnpm@11.1.2 build
npx pnpm@11.1.2 demo:reset
```

The `demo:reset` command requires a reachable Supabase environment and reset-enabled demo configuration.
