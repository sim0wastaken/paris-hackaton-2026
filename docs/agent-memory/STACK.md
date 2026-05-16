# STACK

One-pager: **Responsibility → Component → Why**, plus one ASCII data-flow diagram.
This is the answer to "what's in this repo" in 60 seconds.

## Responsibility map

| Responsibility | Component | Why |
|----------------|-----------|-----|
| Landing/demo shell | `Motive - Landing + SaaS (4)/` | Current static React prototype and product copy. |
| Product brief | `docs/briefing-files/motive-openai-first-hackathon-plan.md` | Canonical scope for OpenAI-first v1 and Pioneer-after-v1 narrative. |
| Web/source extraction | Tavily + OpenAI extraction calls | Gathers homepage/shop/social context and creates first-draft campaign intelligence. |
| Campaign reasoning | OpenAI / GPT-5-class model | Generates source recap, feature map, conversations, landing gaps, ad groups, creative variants, and story KPIs. |
| Realtime workflow | Supabase Realtime + Inngest/background jobs | Streams each extraction phase into HITL so the demo never stalls on a spinner. |
| Specialist classification | Pioneer | After-v1 classifier trained from stored OpenAI labels and HITL corrections. |
| Constraint extraction | Pioneer GLiNER2 | Later extraction of budget, timeline, integration, team-size, and compliance spans. |
| Creative assets | fal.ai | Generates image/video assets after creative angle selection. |
| Feedback loop | `human_reviews` + story-driven `performance_snapshots` | Captures corrections/outcomes and creates the future Pioneer training set. |

## Data flow

```
[URL / shop / social]
        |
        v
[Tavily scrape + OpenAI extraction]
        |
        v
[Persisted source recap, feature map, conversations, landing gaps]
        |
        v
[Realtime HITL review as phases complete]
        |
        v
[Ad groups]
        |
        v
[Title + description + fal.ai creative assets]
        |
        v
[Fake deploy + story-driven monitoring dashboard]
        |
        v
[Stored labels + reviews + performance rows]
        |
        v
[Future Pioneer classifier / Adaptive Inference]
```
