# Project Overview

## Problem

Most acquisition workflows split strategic interpretation, landing-page analysis, ad-group planning, creative writing, launch handoff, and performance diagnosis across separate tools. That fragmentation makes AI-generated campaign work hard to audit and hard to improve because the system forgets why each decision was made.

## Solution

Motive is a campaign workbench that stores the full reasoning trail. A user provides a brand URL and context, then Motive builds a campaign substrate with OpenAI, lets a human approve or correct the generated rows, produces ad groups and creative variants, fake deploys the package, and turns monitoring into a coherent insight story.

The core idea is that every generated row is durable product data:

- `sources` keep the raw and extracted source material.
- `extraction_runs` preserve prompts, model metadata, inputs, outputs, errors, and timings.
- `brand_features`, `conversations`, and `landing_gaps` become reviewable campaign intelligence.
- `human_reviews` records every approval, edit, rejection, or enrichment.
- `ad_groups`, `creative_variants`, `deployments`, and `performance_snapshots` complete the demo loop.

## User Flow

```text
Brand URL + context
  -> source ingestion
  -> OpenAI extraction phases
  -> live human-in-the-loop review
  -> ad-group generation
  -> creative generation
  -> fake deploy
  -> monitoring insights
```

## Demo-Day Product Boundary

In scope:

- OpenAI-first extraction and generation.
- Persistent Supabase data model.
- Progressive review workspace.
- Review actions with before/after audit records.
- Deterministic seeded demo mode.
- Fake deployment and simulated monitoring story.
- Optional fal.ai image generation when configured.

Out of scope for the hackathon demo:

- Real ad-platform publishing.
- Production authentication and tenant isolation beyond the current project-scoped RLS shape.
- Pioneer model training. Pioneer is positioned as the next layer after Motive has accumulated labels, corrections, and performance rows.
- Live Tavily crawling in the critical path. Tavily remains the planned source-ingestion upgrade.

## Why It Fits The Hackathon

The Open Innovation track rewards creativity and technical complexity. Motive is not just a wrapper around a model call; it is a full workflow with background orchestration, structured persistence, human review, provider boundaries, deterministic fallback paths, and an end-to-end demo that turns model outputs into campaign artifacts.

The project also uses partner technology in the main flow. OpenAI is the primary engine for extraction, ad-group generation, creative text, and monitoring synthesis. fal.ai is wired as the media-generation path for creative assets when a key is present.

## Pitch Line

Motive turns a brand link into an auditable AI acquisition workflow: OpenAI builds the campaign substrate, humans validate the rows, and the monitoring story creates the training signal for the next specialist model.
