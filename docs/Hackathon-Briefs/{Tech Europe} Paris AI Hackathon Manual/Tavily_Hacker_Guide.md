# Tavily Hacker Guide

> **Source.** Converted from `Tavily_Hacker_Guide_(2).pdf` (4 pages, Tech Europe Paris AI Hackathon Manual). All text from the PDF is preserved verbatim below. The reference section at the end is enriched with official Tavily documentation pulled via Context7 (`/websites/tavily`) on 2026-05-16; every enrichment row cites its source URL.
>
> **Conventions.** PDF-sourced text is in the body of §1–§8. Enrichments live in §9 and are clearly marked. Where the PDF had OCR gaps, the gap is flagged with `[unclear in source PDF]` rather than invented.

---

## Contents

- [§1 What is Tavily?](#1-what-is-tavily)
- [§2 Valuable Links](#2-valuable-links)
- [§3 Core Endpoints](#3-core-endpoints)
- [§4 Free Credits](#4-free-credits)
- [§5 Getting Your API Key](#5-getting-your-api-key)
- [§6 Quick Start](#6-quick-start)
- [§7 Support](#7-support)
- [§8 Prizes](#8-prizes)
- [§9 Reference — official API surface (Context7-sourced enrichment)](#9-reference--official-api-surface-context7-sourced-enrichment)

---

## §1 What is Tavily?

Tavily is a search API built specifically for AI agents and LLM applications. Unlike traditional search engines designed for humans, Tavily delivers clean, relevant, and structured results optimized for machine consumption, so your AI agents can search the web, extract content, and get real-time information in a single API call.

Whether you're building a research assistant, a RAG pipeline, an autonomous agent, or any application that needs real-time web data, Tavily provides fast, accurate, and LLM-ready search results out of the box.

---

## §2 Valuable Links

| Resource | URL |
|----------|-----|
| Website | [tavily.com](https://tavily.com) |
| Sign up & get API key | [app.tavily.com](https://app.tavily.com) |
| API Documentation | [docs.tavily.com](https://docs.tavily.com) |
| GitHub | [github.com/tavily-ai](https://github.com/tavily-ai) |
| Discord Community | [community.tavily.com](https://community.tavily.com) |

---

## §3 Core Endpoints

| Endpoint | Description | Docs |
|----------|-------------|------|
| `/search` | Search the web and get AI-optimized, structured results with relevant content snippets. | [Link](https://docs.tavily.com/documentation/api-reference/endpoint/search) |
| `/extract` | Extract clean, structured content from any URL — ideal for scraping pages for RAG and agents. | [Link](https://docs.tavily.com/documentation/api-reference/endpoint/extract) |
| `/crawl` | Crawl a website and extract content from multiple pages systematically. | [Link](https://docs.tavily.com/documentation/api-reference/endpoint/crawl) |
| `/map` | Map an entire website's structure, returning all discoverable URLs. | [Link](https://docs.tavily.com/documentation/api-reference/endpoint/map) |
| `/research` | Conduct deep, multi-step research on a topic with comprehensive, synthesized results. | [Link](https://docs.tavily.com/documentation/api-reference/endpoint/research) |

> The "Docs" column linked to the official endpoint reference in the source PDF; the destinations have been resolved to canonical URLs under `docs.tavily.com` based on the PDF's link text ("Link") and §9 (Context7-sourced) confirmation of these paths.

---

## §4 Free Credits

Sign up at [tavily.com](https://tavily.com) to receive **1,000 free API credits per month** on the free tier — no credit card required. This is more than enough to build and demo your hackathon project.

---

## §5 Getting Your API Key

1. Go to [app.tavily.com](https://app.tavily.com) and create a free account.
2. Once logged in, your API key will be displayed on the dashboard.
3. Copy the key and store it as an environment variable:

```bash
export TAVILY_API_KEY="tvly-YOUR_API_KEY"
```

If you're vibe coding and not storing environment variables manually, you can simply ask your AI coding tool in natural language to use Tavily as web search. For example: *"Use Tavily as the web search provider"* or *"Add Tavily search to my agent"*.

---

## §6 Quick Start

Install the Python SDK and make your first search in seconds:

```python
# Install the SDK
# pip install tavily-python

# Use it in your project
from tavily import TavilyClient

client = TavilyClient(api_key="tvly-YOUR_API_KEY")

# Run a search
response = client.search("latest AI agent frameworks 2025")

for result in response["results"]:
    print(result["title"], result["url"])
```

> The PDF showed the install + use lines run together in a single code block; reflowed above for readability without altering tokens.

---

## §7 Support

For support during the hackathon, join the Discord Channel for Tavily for [unclear in source PDF — likely "the Paris AI Hackathon" or similar event qualifier]. Our team and community members are available to help with API questions, integration guidance, and troubleshooting.

---

## §8 Prizes

### Best Use of Tavily

Build a project that leverages Tavily's APIs in a creative and impactful way.

1. **1st Place:** 10,000 API credits
2. **2nd Place:** 5,000 API credits
3. **3rd Place:** 3,000 API credits

---

## §9 Reference — official API surface (Context7-sourced enrichment)

> Everything below is sourced directly from `docs.tavily.com` via Context7 (`/websites/tavily`, fetched 2026-05-16). It supplements the PDF — the PDF did not include parameter shapes. Each subsection cites its origin URL.

### §9.1 Authentication

All requests require an API key. Set it as the `TAVILY_API_KEY` environment variable or pass it directly to the SDK client. Keys start with the `tvly-` prefix.

### §9.2 `POST /search`

Source: <https://docs.tavily.com/documentation/api-reference/endpoint/search> · <https://docs.tavily.com/documentation/integrations/openclaw>

**Request body**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `query` | string | ✓ | — | Search query. Keep under 400 characters. |
| `search_depth` | string | — | `"basic"` | `"basic"` (fast, generic snippets) or `"advanced"` (most relevant sources + content snippets). |
| `topic` | string | — | `"general"` | `"general"`, `"news"`, or `"finance"`. Determines which agent is used. |
| `max_results` | integer | — | `5` | 1–20. |
| `include_answer` | boolean | — | `false` | Include AI-generated answer summary. |
| `include_images` | boolean | — | `false` | Include image URLs. |
| `include_raw_content` | boolean | — | `false` | Include raw scraped content per result. |
| `time_range` | string | — | — | `"day"` / `"week"` / `"month"` / `"year"` (or `"d"` / `"w"` / `"m"` / `"y"`). Filters by publish or last-updated date. |
| `include_domains` | string[] | — | — | Allow-list of domains. |
| `exclude_domains` | string[] | — | — | Deny-list of domains. |
| `auto_parameters` | boolean | — | `false` | When enabled, Tavily auto-configures search parameters from the query. Explicit values still override. `include_answer`, `include_raw_content`, `max_results` must always be set manually. May auto-set `search_depth=advanced`, which uses **2 API credits per request**; pin `search_depth="basic"` to avoid the surcharge. |

**Response (200)** — `{ results[], query, total_results, next_page?, answer? }`. Each result carries `title`, `url`, `content`, `score`, optional `published_time`, optional `images`.

### §9.3 `POST /extract`

Source: <https://docs.tavily.com/documentation/integrations/openclaw>

**Request body**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `urls` | string[] | ✓ | — | 1–20 URLs per request. |
| `query` | string | — | — | Re-rank extracted chunks by relevance to this query. |
| `extract_depth` | string | — | `"basic"` | `"basic"` or `"advanced"` (for JS-heavy pages). |
| `chunks_per_source` | integer | — | — | 1–5. Requires `query`. |
| `include_images` | boolean | — | `false` | Include image URLs. |

**Response (200)** — `{ results[] }` where each entry has `url`, `content` (or `raw_content`), optional `images[]`.

### §9.4 `POST /crawl`

Source: <https://docs.tavily.com/documentation/api-reference/endpoint/crawl>

Crawl a website starting from a URL, with optional natural-language `instructions` to guide which pages to follow. Python SDK example:

```python
from tavily import TavilyClient

tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")
response = tavily_client.crawl(
    "https://docs.tavily.com",
    instructions="Find all pages on the Python SDK",
)
print(response)
```

### §9.5 `POST /map`

Source: <https://docs.tavily.com/examples/quick-tutorials/map-api>

Map a site's structure and return discoverable URLs. Supports `select_paths` regex filters, `max_depth`, and `allow_external`.

```python
from tavily import TavilyClient
import os

client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

map_response = client.map(
    url="https://docs.tavily.com",
    select_paths=["/documentation/api-reference/endpoint/.*"],
    max_depth=2,
    allow_external=False,
)

api_urls = map_response["results"][:5]

extract_response = client.extract(urls=api_urls, extract_depth="advanced")
for result in extract_response["results"]:
    print(f"\n--- {result['url']} ---")
    print(result["raw_content"][:300])
```

### §9.6 `POST /research`

Source: <https://docs.tavily.com/documentation/api-reference/endpoint/research>

Comprehensive multi-step research: conducts multiple searches, analyzes sources, and synthesizes a report.

**Request body**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `input` | string | ✓ | — | Research task or question. |
| `model` | string | — | `"auto"` | `"mini"`, `"pro"`, or `"auto"`. |
| `stream` | boolean | — | `false` | Stream results as generated. |
| `output_schema` | object | — | `null` | JSON Schema defining the output structure. |

**Response (200)** — `{ results[], score, message, query_type, answer, detailed, url_results[] }`.

### §9.7 Python SDK — minimal usage

Source: <https://docs.tavily.com/sdk/javascript/reference> (Python example)

```python
from tavily import TavilyClient

tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")
response = tavily_client.search("Who is Leo Messi?")
print(response)
```

Install via `pip install tavily-python`. Method names on `TavilyClient` mirror the endpoints: `.search(...)`, `.extract(...)`, `.crawl(...)`, `.map(...)`. The `/research` endpoint is also wrapped (see docs for the latest method name).

### §9.8 Quick parameter cheat sheet (per-endpoint, for agent code)

```text
search(query, *, search_depth="basic", topic="general", max_results=5,
       include_answer=False, include_images=False, include_raw_content=False,
       time_range=None, include_domains=None, exclude_domains=None,
       auto_parameters=False)

extract(urls, *, query=None, extract_depth="basic",
        chunks_per_source=None, include_images=False)

crawl(url, *, instructions=None, ...)   # see /crawl reference for full options

map(url, *, select_paths=None, max_depth=None, allow_external=False, ...)

research(input, *, model="auto", stream=False, output_schema=None)
```

### §9.9 Cost notes for hackathon budgeting

- Free tier: **1,000 credits / month**, no card (§4).
- `search_depth="advanced"` or `auto_parameters=True` auto-promoting to advanced costs **2 credits per request** (vs 1 for basic). Pin `search_depth="basic"` when budgeting matters (per §9.2).
- Prizes are paid in API credits (§8): 10k / 5k / 3k.

---

*End of converted brief. If the source PDF is updated, re-run the conversion and re-pull §9 from Context7 — never edit §1–§8 to match new upstream behaviour; instead amend §9 and note the discrepancy.*
