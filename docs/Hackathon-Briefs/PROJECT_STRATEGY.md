# Paris Hackathon Strategy — Motive OpenAI-first

This file is the project interpretation of the supplied Paris AI Hackathon briefs. The source briefs remain unchanged.

## Main Demo Fit

The hackathon demo should optimize for a complete, understandable product loop. The user drops in a brand link, adds context files, watches OpenAI extraction phases appear live in HITL, validates ideas, generates ad-group creatives, fake deploys, and views story-driven monitoring.

This is leaner than making Pioneer a critical-path dependency before there is data to classify.

## Pioneer Prize Fit

The Pioneer side challenge remains relevant as the next layer:

- **Stored labels:** OpenAI extraction and HITL review create the dataset.
- **Fine-tuned specialist:** Pioneer can later replace repeated GPT classification calls for conversations, intent, landing gaps, and creative angles.
- **GLiNER2:** Constraint extraction can target budget, timeline, integration, team-size, and compliance spans.
- **Adaptive loop:** Performance snapshots and human reviews become future retraining / Adaptive Inference inputs.

## Demo-day Scope

```text
Brand link + context files
  -> OpenAI extraction
  -> phase-by-phase HITL review
  -> ad groups
  -> creatives
  -> fake deploy
  -> story-driven monitoring dashboard
```

## Pioneer Narrative

```text
stored OpenAI labels + human corrections + performance rows
  -> future Pioneer classifier
  -> cheaper/faster repeated labeling
  -> later self-improving loop
```

## Pitch Line

OpenAI powers the first complete campaign workflow. Realtime extraction makes the demo feel alive, and the story-driven KPI dashboard shows the training signal Pioneer can learn from tomorrow.
