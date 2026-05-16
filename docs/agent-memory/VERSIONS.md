# VERSIONS

Pinned versions for every dep. Updated whenever a dep lands. Consult before running install commands.

## Toolchain

| Tool | Version | Pinned via | Notes |
|------|---------|------------|-------|
| Node.js | 25.9.0 | Local runtime | Used for this scaffold verification. Choose deployment LTS before production packaging. |
| pnpm | 11.1.2 | Root `packageManager` and `npx pnpm@11.1.2` | Workspace package manager. |
| Supabase CLI | 2.98.2 | Root `package.json` | Local DB commands. |
| Inngest CLI | 1.19.4 | Root `package.json` | Local Inngest Dev Server. |
| Vercel CLI | 54.1.0 | Installed globally via `npm i -g vercel@54.1.0` | Deploys + env management + Marketplace integration installs. |
| psql | 14.22 (Homebrew) | System | Used to push remote Supabase migrations + seed (skips `supabase login` flow). |
| React UMD | 18.3.1 | `Motive - Landing + SaaS (4)/Motive Landing.html` | Static landing prototype. |
| Babel standalone | 7.29.0 | `Motive - Landing + SaaS (4)/Motive Landing.html` | Browser JSX transform for prototype only. |

## Language packages

| Package | Version | Manifest | Notes |
|---------|---------|----------|-------|
| next | 16.2.6 | `apps/web/package.json` | App Router runtime. |
| react | 19.2.6 | `apps/web/package.json` | UI runtime. |
| react-dom | 19.2.6 | `apps/web/package.json` | UI rendering. |
| zod | 4.4.3 | `apps/web/package.json` | Runtime validation. |
| @supabase/supabase-js | 2.105.4 | `apps/web/package.json` | Supabase service-role client. |
| @supabase/ssr | 0.10.3 | `apps/web/package.json` | Browser/server SSR clients. |
| inngest | 4.4.0 | `apps/web/package.json` | Event client and function registry. |
| lucide-react | 1.16.0 | `apps/web/package.json` | UI icons. |
| server-only | 0.0.1 | `apps/web/package.json` | Server-only import guard for service-role client. |
| tailwindcss | 4.3.0 | `apps/web/package.json` | Styling. |
| @tailwindcss/postcss | 4.3.0 | `apps/web/package.json` | Tailwind PostCSS plugin. |
| postcss | 8.5.14 | `apps/web/package.json` | CSS processing. |
| typescript | 6.0.3 | `apps/web/package.json` | Strict typechecking. |
| eslint | 9.39.4 | `apps/web/package.json` | Linting; pinned to ESLint 9 because React plugin in `eslint-config-next` is not ESLint 10-safe. |
| eslint-config-next | 16.2.6 | `apps/web/package.json` | Next.js lint config. |
| vitest | 4.1.6 | `apps/web/package.json` | Unit tests. |
| @types/node | 25.8.0 | `apps/web/package.json` | Node types. |
| @types/react | 19.2.14 | `apps/web/package.json` | React types. |
| @types/react-dom | 19.2.3 | `apps/web/package.json` | React DOM types. |

## Provider APIs

| Provider | API / model surface | Where used | Notes |
|----------|---------------------|------------|-------|
| OpenAI | GPT-5-class extraction / generation | Source recap, feature map, conversations, landing gaps, ad groups, creative text | Critical path for v1. Persist every input/output. |
| Pioneer | Fine-tuning, inference, GLiNER2, Adaptive Inference | After-v1 classifier and future feedback loop | Not critical path for first product iteration. |
| Tavily | Search / extract / crawl | Source context from URL, shop, social profiles | Hackathon docs include Tavily guide. |
| fal.ai | Generative media | Creative image/video assets | Downstream from creative angle selection. |

## Infrastructure images

| Image | Tag | Where pinned | Rationale |
|-------|-----|--------------|-----------|
| _TBD_ |  |  |  |

> Never use `latest`. Prefer LTS / stable. Be suspicious of `-alpine` variants for data stores (§11.1).
