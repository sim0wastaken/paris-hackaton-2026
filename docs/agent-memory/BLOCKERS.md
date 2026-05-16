# BLOCKERS

Append-only log of deferred/stubbed subsystems. Created when the agent hits the 30-minute wall on a subsystem (§8.5).
Every stub in code carries `TODO(blocker: <YYYY-MM-DD>)` cross-referencing this file.
When resolved, amend the entry with a resolution note **below** the original content — append, do not rewrite.

Format:

```
## YYYY-MM-DD — <subsystem>: <one-line what was blocked>
**What:** …
**What I found:** …
**What I tried:** …
**Resolution / stub:** …
**Follow-up (post-<milestone>):** …
```

---

## 2026-05-16 — self-improving loop: intentionally scoped for demo
**What:** The project will show feedback-loop plumbing (`outcome_log`, `/retrain`, flywheel widget) but will not require a completed live retraining cycle during the hackathon.
**What I found:** The credible demo-day artifact is the Pioneer Conversation/Intent Classifier. Self-improvement becomes true only when HITL corrections and campaign outcomes feed future training rows.
**What I tried:** Scoped the loop in `docs/briefing-files/pioneer-conversation-intent-classifier.md` as visible but dormant plumbing.
**Resolution / stub:** Build the logging and retrain trigger surface; defer drift detection, canary rollout, rollback, and real ad-platform KPI ingestion.
**Follow-up (post-demo):** Connect real ad-platform outcomes, add model-version registry, canary/rollback, and automated retrain thresholds.
---

## 2026-05-16 — Pioneer classifier: deferred out of v1 critical path
**What:** The project will not block the core demo on Pioneer fine-tuning, classifier deployment, or Adaptive Inference.
**What I found:** The higher-confidence hackathon path is a complete persisted OpenAI-first workflow: link/context ingestion, extraction, HITL review, ad groups, creatives, fake deploy, and monitoring.
**What I tried:** Superseded the previous Pioneer-first ADR with ADR-0002 and updated the product brief.
**Resolution / stub:** Keep Pioneer as after-v1 training/eval layer fed by stored OpenAI labels, human reviews, and performance snapshots.
**Follow-up (post-core-loop):** Train/evaluate the Pioneer classifier once enough persisted rows exist.
---

## 2026-05-16 — demo UX: spinner and random KPI risks removed
**What:** A single progress spinner during OpenAI extraction and random monitoring KPIs would hurt the hackathon demo.
**What I found:** Extraction should stream phase-by-phase into HITL, and simulated KPIs should tell an insight story tied to creative/ad-group quality.
**What I tried:** Added ADR-0003 and updated the canonical brief/plan.
**Resolution / stub:** Build Supabase Realtime + Inngest/background job updates for extraction phases. Generate story-driven `performance_snapshots` with insights and recommended actions.
**Follow-up (post-demo):** Replace simulated snapshots with real ad-platform outcomes.
---
