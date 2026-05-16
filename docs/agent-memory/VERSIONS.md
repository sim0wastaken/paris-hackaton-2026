# VERSIONS

Pinned versions for every dep. Updated whenever a dep lands. Consult before running install commands.

## Toolchain

| Tool | Version | Pinned via | Notes |
|------|---------|------------|-------|
| React UMD | 18.3.1 | `Motive - Landing + SaaS (4)/Motive Landing.html` | Static landing prototype. |
| Babel standalone | 7.29.0 | `Motive - Landing + SaaS (4)/Motive Landing.html` | Browser JSX transform for prototype only. |

## Language packages

| Package | Version | Manifest | Notes |
|---------|---------|----------|-------|
| _TBD_ |  |  | App package manifest not created yet. |

## Provider APIs

| Provider | API / model surface | Where used | Notes |
|----------|---------------------|------------|-------|
| OpenAI | GPT-5-class extraction / generation | Source recap, feature map, conversations, landing gaps, ad groups, creative text | Critical path for v1. Persist every input/output. |
| Pioneer | Fine-tuning, inference, GLiNER2, Adaptive Inference | After-v1 classifier and future feedback loop | Not critical path for first product iteration. |
| Tavily | Search / extract / crawl | Source context from URL, shop, social profiles | Hackathon docs include Tavily guide. |
| fal.ai | Generative media | Creative image/video assets | Downstream from creative angle selection. |

## Infrastructure images

| Image | Tag | Where pinned | Rationale |
|-------|-----|--------------|-----------|
| _TBD_ |  |  |  |

> Never use `latest`. Prefer LTS / stable. Be suspicious of `-alpine` variants for data stores (§11.1).
