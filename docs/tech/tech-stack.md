
Next.js 16 (apps/web — Vercel)
React
TypeScript
REST + Zod for webhooks and voice tools
Zustand global state
Supabase Postgres/Auth/RLS/Realtime/Storage
Prisma
React Aria Components
Tailwind CSS
React Hook Form
Zod
Tanstack Query
TanStack Table
Recharts
Lucide
OpenAI
Inngest
Vercel (apps/web) + Google Cloud Run europe-west8 (apps/voice)
Supabase CLI migrations

PROVIDERS:
- Vercel
- OpenAI
- Fal.ai (creatives)
- Pioneer (after-v1 classifier / GLiNER2 constraints extraction / future Adaptive Inference)
- Tavily (web extraction / crawling for source context)

HACKATHON BUILD ORDER:
- First ship the OpenAI-first product loop: streaming extraction, persistence, HITL review, ad groups, creatives, fake deploy, story-driven monitoring.
- Use Supabase Realtime + Inngest/background jobs so each OpenAI phase lands into HITL as it completes.
- Monitoring KPIs must be generated as a coherent performance story tied to ad-group/creative quality, not random numbers.
- Pioneer is intentionally out of the v1 critical path.
- After stored OpenAI labels and HITL corrections exist, Pioneer can replace repeated GPT classification calls for `stage`, `intent_type`, `buyer_role`, `ad_group`, `landing_gap_type`, and `creative_angle_type`.
- GLiNER2 can later handle `constraints` spans: budget, timeline, integration, team-size, compliance.
