import type { SourceInsertDraft, SourceRecord } from "./projects";
import { pruneScrapedMarkdown } from "./scrape-pruning";

const CRAWL_INSTRUCTIONS =
  "You are mapping a brand's marketing website for a campaign-extraction agent. " +
  "Keep ONLY pages that reveal: brand positioning, products or services, pricing, customers or case studies, " +
  "ICP/industry pages, founder/about, integrations, and primary blog landing. " +
  "EXCLUDE: legal/privacy/cookie/terms, login or app routes, language switches, " +
  "generic blog posts older than 6 months unless they describe a product launch, image-only pages, contact forms.";

const SELECT_PATHS = [
  "/",
  "/about.*",
  "/product.*",
  "/solutions?.*",
  "/service.*",
  "/pricing.*",
  "/customers?.*",
  "/case-stud.*",
  "/works?.*",
  "/industries?.*",
  "/platform.*",
  "/features.*",
  "/why.*",
  "/manifesto.*"
];

const EXCLUDE_PATHS = [
  "/privacy.*",
  "/cookie.*",
  "/terms.*",
  "/legal.*",
  "/login.*",
  "/signin.*",
  "/signup.*",
  "/app/.*",
  "/contact.*",
  "/careers?.*",
  "/jobs?.*",
  "/.*\\.(jpg|png|svg|webp|pdf)$"
];

export type DiscoveredPage = {
  url: string;
  pruned_content: string;
  raw_payload: Record<string, unknown>;
};

export type BrandDiscovererPageResult = {
  pages: DiscoveredPage[];
  raw_crawl_response: Record<string, unknown>;
  failure_reason?: string;
};

export type BrandDiscovererSearchResult = {
  markdown: string;
  raw_payload: Record<string, unknown>;
};

export type BrandDiscoverer = {
  isConfigured(): boolean;
  crawl(input: { brandUrl: string; requestId: string }): Promise<BrandDiscovererPageResult>;
  search(input: { query: string; excludeDomains: string[]; requestId: string }): Promise<BrandDiscovererSearchResult | null>;
};

export type DiscoveryRepository = {
  updateSource(sourceId: string, patch: Partial<SourceRecord>): Promise<SourceRecord>;
  appendChildSource(
    projectId: string,
    parentSourceId: string,
    source: SourceInsertDraft
  ): Promise<SourceRecord>;
};

export type DiscoveryEvents = {
  sendExtractionRequested(projectId: string, sourceIds: string[], demoMode?: boolean): Promise<void>;
};

export type DiscoverBrandSourcesInput = {
  projectId: string;
  parentSource: SourceRecord;
  requestId: string;
};

export type DiscoverBrandSourcesResult = {
  parent: SourceRecord;
  children: SourceRecord[];
  externalContext: SourceRecord | null;
};

export async function discoverBrandSources(
  input: DiscoverBrandSourcesInput,
  deps: {
    repository: DiscoveryRepository;
    events: DiscoveryEvents;
    discoverer: BrandDiscoverer;
  }
): Promise<DiscoverBrandSourcesResult | { parent: SourceRecord; children: []; externalContext: null }> {
  const { parentSource, projectId, requestId } = input;

  if (!parentSource.uri) {
    const failed = await deps.repository.updateSource(parentSource.id, {
      status: "failed",
      error: "missing_source_uri"
    });
    return { parent: failed, children: [], externalContext: null };
  }

  if (!deps.discoverer.isConfigured()) {
    const skipped = await deps.repository.updateSource(parentSource.id, {
      status: "skipped",
      error: "tavily_not_configured",
      provider_response_json: {
        skipped: true,
        reason: "TAVILY_API_KEY is not configured"
      }
    });
    return { parent: skipped, children: [], externalContext: null };
  }

  await deps.repository.updateSource(parentSource.id, { status: "processing", error: null });

  const crawl = await deps.discoverer.crawl({ brandUrl: parentSource.uri, requestId });
  if (crawl.pages.length === 0) {
    const reason = crawl.failure_reason ?? "tavily_empty_crawl";
    const failedParent = await deps.repository.updateSource(parentSource.id, {
      status: "failed",
      error: reason,
      provider_response_json: crawl.raw_crawl_response
    });
    return { parent: failedParent, children: [], externalContext: null };
  }

  // The first page in the crawl (typically the homepage) becomes the parent's
  // own extracted content so it stays useful as a top-level source row.
  const anchor = pickAnchorPage(crawl.pages, parentSource.uri);
  const otherPages = crawl.pages.filter((page) => page !== anchor);

  const parent = await deps.repository.updateSource(parentSource.id, {
    status: "processed",
    raw_text: anchor.pruned_content,
    extracted_text: anchor.pruned_content,
    error: null,
    provider_response_json: crawl.raw_crawl_response,
    metadata: {
      ...parentSource.metadata,
      character_count: anchor.pruned_content.length,
      discovered_page_count: crawl.pages.length,
      processed_at: new Date().toISOString()
    }
  });

  const children: SourceRecord[] = [];
  for (const page of otherPages) {
    const child = await deps.repository.appendChildSource(projectId, parent.id, {
      type: "url",
      name: derivePageName(page.url),
      uri: page.url,
      raw_text: page.pruned_content,
      extracted_text: page.pruned_content,
      status: "processed",
      provider: "tavily",
      provider_request_json: { source: "crawl", parent_uri: parentSource.uri },
      provider_response_json: page.raw_payload,
      metadata: {
        character_count: page.pruned_content.length,
        parent_source_id: parent.id,
        discovered_via: "tavily_crawl"
      }
    });
    children.push(child);
  }

  let externalContext: SourceRecord | null = null;
  try {
    const hostname = new URL(parentSource.uri).hostname.replace(/^www\./, "");
    const searchQuery = `${hostname} brand company overview reviews`;
    const search = await deps.discoverer.search({
      query: searchQuery,
      excludeDomains: [hostname, `www.${hostname}`],
      requestId
    });
    if (search && search.markdown.trim()) {
      externalContext = await deps.repository.appendChildSource(projectId, parent.id, {
        type: "markdown",
        name: "External context (Tavily search)",
        uri: null,
        raw_text: search.markdown,
        extracted_text: search.markdown,
        status: "processed",
        provider: "tavily",
        provider_request_json: { source: "search", query: searchQuery },
        provider_response_json: search.raw_payload,
        metadata: {
          character_count: search.markdown.length,
          parent_source_id: parent.id,
          discovered_via: "tavily_search"
        }
      });
    }
  } catch {
    // External context is best-effort; never fail the whole intake on a bad search.
    externalContext = null;
  }

  const sourceIds = [parent.id, ...children.map((c) => c.id)];
  if (externalContext) sourceIds.push(externalContext.id);
  await deps.events.sendExtractionRequested(projectId, sourceIds, false);

  return { parent, children, externalContext };
}

export function buildCrawlRequestParams() {
  return {
    instructions: CRAWL_INSTRUCTIONS,
    selectPaths: SELECT_PATHS,
    excludePaths: EXCLUDE_PATHS,
    maxDepth: 2,
    limit: 12,
    extractDepth: "advanced" as const,
    allowExternal: false
  };
}

export function formatSearchMarkdown(results: Array<{ title?: string; url: string; content?: string; published_date?: string | null }>, answer: string | null | undefined): string {
  const lines: string[] = ["# External context (third-party signal)"];
  if (answer && answer.trim()) {
    lines.push("", "## Synthesized answer", answer.trim());
  }
  lines.push("", "## Top results");
  for (const result of results) {
    const title = result.title?.trim() || result.url;
    const snippet = (result.content ?? "").trim().slice(0, 500);
    const date = result.published_date ? ` _(published ${result.published_date})_` : "";
    lines.push(`- **${title}**${date} — ${result.url}`);
    if (snippet) lines.push(`  > ${snippet.replace(/\n+/g, " ")}`);
  }
  return pruneScrapedMarkdown(lines.join("\n"), { maxChars: 4000 });
}

function pickAnchorPage(pages: DiscoveredPage[], brandUrl: string): DiscoveredPage {
  let brandPath: string;
  try {
    brandPath = new URL(brandUrl).pathname || "/";
  } catch {
    brandPath = "/";
  }
  const exact = pages.find((page) => {
    try {
      return new URL(page.url).pathname === brandPath;
    } catch {
      return false;
    }
  });
  if (exact) return exact;
  const root = pages.find((page) => {
    try {
      return (new URL(page.url).pathname || "/") === "/";
    } catch {
      return false;
    }
  });
  return root ?? pages[0];
}

function derivePageName(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    if (!path || path === "/") return parsed.hostname;
    const last = path.split("/").filter(Boolean).pop() ?? parsed.hostname;
    return last.replace(/[-_]/g, " ");
  } catch {
    return url;
  }
}
