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

## 2026-07-07 — Closure pass: all three entries dispositioned by the motive port (ADR-0008)
**What:** Founder-mode closure of every open blocker, in place of further work in this repo.
**Resolution:**
- *Self-improving loop (2026-05-16):* CLOSED — permanently scoped as labeled training exhaust, never a live loop. In `sim0wastaken/motive` the plumbing exists as `providerEvents` (every provider request/response persisted), intent/ad-group HITL reviews, and simulated `performanceSnapshots`; no self-improvement is claimed anywhere (motive `docs/ARCHITECTURE.md` Invariant 6). Drift detection, canary, rollback, and real ad-platform KPI ingestion stay out of MVP scope.
- *Pioneer classifier (2026-05-16):* CLOSED — permanently descoped from the product critical path per ADR-0008. The training corpus it would need keeps accumulating in motive's `providerEvents`/review/snapshot tables; a classifier is a post-traction experiment, not a blocker.
- *Demo UX risks (2026-05-16):* CLOSED — both invariants carried into motive structurally: Convex live queries make streaming-not-spinner the default (statuses, intents, checks, kit rows, and forecast rows insert one-by-one), and the launch forecast is deterministic story-KPI scoring (`src/lib/campaign.ts`, tested for determinism) with an LLM pass allowed to touch prose only.
**Follow-up:** None in this repo. Future work happens in `sim0wastaken/motive`.
---
