# SECRETS

Inventory + rotation procedure + incident response. **Never** actual secret values.

## Inventory

| Env var | Purpose | Source / generator | Rotation cadence | Owner |
|---------|---------|--------------------|------------------|-------|
| `OPENAI_API_KEY` | Synthetic data, first-draft campaign rows, GPT labeling/eval | OpenAI dashboard / hackathon voucher | Rotate after hackathon and on leak | Project owner |
| `PIONEER_API_KEY` | After-v1 Pioneer inference, fine-tuning, datasets, feedback / Adaptive Inference | Pioneer dashboard | Rotate after hackathon and on leak | Project owner |
| `TAVILY_API_KEY` | Web search/extract/crawl for source context | Tavily dashboard | Rotate after hackathon and on leak | Project owner |
| `FAL_KEY` | Generative media assets | fal dashboard / hackathon credits | Rotate after hackathon and on leak | Project owner |
| `DATABASE_URL` | Projects, sources, extraction runs, reviews, creatives, fake deployments, performance snapshots | Supabase or chosen Postgres provider | Rotate per provider policy and on leak | Project owner |

## Rotation procedure

For hackathon demo keys, revoke in each provider dashboard, create a replacement, update local `.env`, rerun the classifier smoke test, then verify no secret value was committed. Never commit real keys; use `.env.example` placeholders only.

## Incident response

If a secret leaks: revoke immediately, rotate dependent services, inspect git history and logs for exposure, invalidate affected demo deployments, and record the incident in `BLOCKERS.md` if it slows delivery.
