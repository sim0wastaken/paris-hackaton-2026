# DECISIONS — ADR-lite

One entry per architectural decision, separator `---`. Once Accepted, never edit — supersede with a new ADR and update the old one's Status line.

Format:

```
## ADR-NNNN — <one-line title>
**Status:** {Proposed, Accepted, Superseded by ADR-NNNN} · **Date:** YYYY-MM-DD
**Context:** <why the decision was needed>
**Decision:** <what was chosen>
**Consequences:** <what this implies, especially tradeoffs>
```

---

## ADR-0001 — Pioneer is the specialist campaign classifier
**Status:** Superseded by ADR-0002 · **Date:** 2026-05-16
**Context:** Motive needs a Pioneer integration that is central to the product and credible for the Paris AI Hackathon. The landing copy and Excalidraw sketch already point toward conversational intent maps, ad groups, landing gaps, creative angles, and a tentative self-improving campaign monitor.
**Decision:** Use Pioneer as the live Conversation/Intent Classifier for demo day. OpenAI/Tavily produce source context and first-draft labels; Pioneer classifies the structured Motive row; GLiNER2 extracts constraints; HITL corrections and campaign outcomes are logged for future retraining / Adaptive Inference.
**Consequences:** The demo should prove a working classifier and an eval chart, not a complete autonomous retraining platform. The self-improving claim must be phrased as a feedback loop that becomes stronger from real corrections and outcomes.
---

## ADR-0002 — Build OpenAI-first and keep Pioneer out of the v1 critical path
**Status:** Accepted · **Date:** 2026-05-16
**Context:** The hackathon needs a concise, lean, demonstrable product. A live Pioneer fine-tune/classifier creates unnecessary dependency risk before Motive has persisted data. The most compelling first demo is the full workflow from brand ingestion to extraction, HITL, ad groups, creatives, fake deploy, and monitoring.
**Decision:** Build the first iteration completely independent from Pioneer. OpenAI powers extraction and generation; the database persists every source, prompt, output, review, ad group, creative, fake deployment, and performance snapshot. Pioneer is positioned as the after-v1 classifier trained from stored OpenAI labels, HITL corrections, and performance rows.
**Consequences:** The immediate build order is scaffold -> schema -> OpenAI extraction -> ad groups -> creatives -> dashboards. Pioneer work starts only after the core product loop works. The Pioneer prize narrative remains credible because the product creates the dataset needed for a smaller classifier.
---

## ADR-0003 — Stream extraction into HITL and generate story KPIs
**Status:** Accepted · **Date:** 2026-05-16
**Context:** Eight OpenAI phases can take 30-90 seconds. A spinner-only waiting screen weakens the live demo. Random mocked KPI numbers also make the monitoring dashboard read as vaporware.
**Decision:** Use Supabase Realtime and/or Inngest events so each completed extraction phase lands into the HITL workspace immediately. Generate performance snapshots as a coherent story tied to creative specificity, intent fit, and landing gaps.
**Consequences:** The demo shows useful rows appearing live: recap, feature map, conversations, intents/stages, landing gaps, and ad groups. The monitoring dashboard can point to a plausible learning signal for future Pioneer training instead of random metrics.
---
