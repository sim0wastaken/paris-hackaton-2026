# Partner Technologies

## OpenAI - Confirmed Primary Partner Use

OpenAI is the critical-path AI partner technology in Motive.

Used for:

- Source recap generation.
- Feature, value proposition, use case, proof point, and objection extraction.
- Buying-conversation generation.
- Intent, stage, buyer-role, and constraint labeling.
- Landing-gap analysis.
- Ad-group proposal generation.
- Creative text and creative-angle generation.
- Monitoring synthesis and insight narration.

Why it matters:

- The demo is a complete workflow, not a single prompt.
- Inputs and outputs are persisted in `extraction_runs` and related tables.
- Human corrections are stored as future training data.
- The product can run live with keys or deterministically in seeded demo mode.

## fal.ai - Optional Creative Media Path

fal.ai is integrated as the generative media path for creative assets.

Used when configured:

- `FAL_KEY` enables image generation for creative variants.
- Generated assets can be stored on `creative_variants.asset_url`.
- Provider request/response payloads and errors are persisted.

Fallback behavior:

- If `FAL_KEY` is absent, Motive still generates title, description, creative angle, and asset prompt.
- This makes the demo robust while still documenting the media-generation extension.

## Tavily - Planned Source-Ingestion Upgrade

Tavily is documented in the hackathon briefs as a web search, extraction, crawl, map, and research API for AI agents.

Current boundary:

- `TAVILY_API_KEY` is present in the environment schema.
- The live Tavily crawling path is deferred from the critical-path demo.
- The source ingestion model is already structured to accept URL, text, markdown, PDF, screenshot, and product-feed sources.

Planned use:

- Use Tavily `/extract` for clean page content from brand URLs.
- Use `/crawl` or `/map` for broader site coverage.
- Use `/search` for competitor and market context.
- Persist Tavily request/response bodies on `sources` so judge-visible provenance remains auditable.

## Pioneer - Post-V1 Specialist Classifier

Pioneer is positioned as the next layer after Motive has enough stored labels and outcomes.

Why it is not critical path in the hackathon build:

- A useful specialist classifier needs a corpus.
- Motive first creates that corpus from OpenAI outputs, human review corrections, ad groups, creative variants, and performance rows.

Planned Pioneer tasks:

- Train or evaluate a smaller classifier to replace repeated GPT classification calls.
- Use GLiNER2 for constraint extraction: budget, timeline, integration, team size, and compliance spans.
- Use human review and performance snapshots as an adaptive feedback loop.

Honest pitch:

> Today OpenAI powers the full campaign workflow. Every validated row Motive stores becomes training data for a smaller Pioneer classifier that can later label conversations faster and more cheaply.
