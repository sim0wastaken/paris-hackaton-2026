# SECRETS

Inventory + rotation procedure + incident response. **Never** actual secret values.

## Production source of truth

All production secrets live in **Vercel project env (encrypted at rest)** for `sim0wastakens-projects/paris-hackaton-2026`. Inspect with `vercel env ls production`. Local `.env.local` / `.env.production` files are gitignored and should be deleted after use.

## Inventory

| Env var | Purpose | Source / generator | Where stored (prod) | Rotation cadence | Owner |
|---------|---------|--------------------|---------------------|------------------|-------|
| `OPENAI_API_KEY` | Synthetic data, first-draft campaign rows, GPT labeling/eval | OpenAI dashboard / hackathon voucher | Vercel env (Production) | Rotate after hackathon and on leak; **rotate now if exposed in chat 2026-05-16 14:48 UTC** | Project owner |
| `PIONEER_API_KEY` | After-v1 Pioneer inference, fine-tuning, datasets, feedback / Adaptive Inference | Pioneer dashboard | Not in Vercel yet (post-v1) | Rotate after hackathon and on leak | Project owner |
| `TAVILY_API_KEY` | Web search/extract/crawl for source context | Tavily dashboard | Vercel env (Production) | Rotate after hackathon and on leak; **rotate now if exposed in chat 2026-05-16 14:48 UTC** | Project owner |
| `FAL_KEY` | Generative media assets | fal dashboard / hackathon credits | Vercel env (Production) | Rotate after hackathon and on leak; **rotate now if exposed in chat 2026-05-16 14:48 UTC** | Project owner |
| `DATABASE_URL` | App runtime Postgres connection (pooled) | Aliased to Marketplace-injected `POSTGRES_URL` | Vercel env (Production) | Rotate via Supabase dashboard; re-pull `vercel env` and re-add alias | Project owner |
| `POSTGRES_URL_NON_POOLING` | Direct connection for migrations / seed pushes via psql | Supabase Marketplace auto-inject | Vercel env (Production/Preview/Development) | Same as above | Project owner |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin client for service-role queries | Supabase Marketplace auto-inject | Vercel env (Production/Preview/Development) | Rotate via Supabase dashboard | Project owner |
| `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` · `SUPABASE_ANON_KEY` (alias) | Browser + SSR clients (anon/publishable identity) | Supabase Marketplace auto-inject | Vercel env (Production/Preview/Development) | Rotate via Supabase dashboard | Project owner |
| `INNGEST_EVENT_KEY` · `INNGEST_SIGNING_KEY` | Inngest Cloud event dispatch + serve auth | Inngest Cloud dashboard | Vercel env (Production) | Rotate via Inngest dashboard | Project owner |
| `NEXT_PUBLIC_APP_URL` | Hardcoded prod URL for absolute links | Manual: `https://paris-hackaton-2026.vercel.app` | Vercel env (Production) | Update if domain changes | Project owner |

## Rotation procedure

For hackathon demo keys, revoke in each provider dashboard, create a replacement, then in this repo:
1. `printf '<new-value>' | vercel env add <NAME> production` (re-add overwrites)
2. `vercel --prod --force --yes` to rebuild with the new value (Vercel does **not** auto-rebuild on env change)
3. Verify with `curl https://paris-hackaton-2026.vercel.app/...` against an endpoint that uses the rotated key
4. Confirm no secret value was committed; remove any pulled `.env.local` / `.env.production` files

Never commit real keys; use `.env.example` placeholders only.

## Incident response

If a secret leaks: revoke immediately, rotate dependent services, inspect git history and logs for exposure, invalidate affected demo deployments (`vercel rollback` to a prior good URL while rotating), and record the incident in `BLOCKERS.md` if it slows delivery.

### Known exposure (2026-05-16 14:48 UTC)
The hackathon-issued `OPENAI_API_KEY`, `TAVILY_API_KEY`, and `FAL_KEY` were pasted as plaintext into the deploy-session chat transcript. They are set in Vercel env (encrypted at rest). **Rotate at hackathon end** (or sooner if the chat transcript is shared more broadly than the immediate session). `SUPABASE_SERVICE_ROLE_KEY` was not exposed in chat — it was downloaded server-to-server via `vercel env pull` and the local file was deleted immediately after use.
