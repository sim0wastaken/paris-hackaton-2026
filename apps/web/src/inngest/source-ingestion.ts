import { MOTIVE_EVENTS } from "@/inngest/events";
import { inngest } from "@/inngest/client";
import {
  buildCrawlRequestParams,
  formatSearchMarkdown,
  type BrandDiscoverer,
  type DiscoveredPage
} from "@/lib/motive/brand-discovery";
import { pruneScrapedMarkdown } from "@/lib/motive/scrape-pruning";
import { processSourceIngestion } from "@/lib/motive/source-ingestion";
import {
  crawlBrandSite,
  searchBrandContext,
  getTavilyPageContent,
  extractTavilyFailureReason,
  extractUrlWithTavily
} from "@/lib/providers/tavily";

export const sourceIngestion = inngest.createFunction(
  {
    id: "source-ingestion",
    triggers: [{ event: MOTIVE_EVENTS.sourceIngestRequested }]
  },
  async ({ event, step }) => {
    return step.run("process-source-ingestion", async () => {
      const { createSupabaseIntakeRepository } = await import("@/lib/motive/supabase-projects");
      const projectId = String(event.data.projectId);
      const sourceId = String(event.data.sourceId);
      const requestId = String(event.data.requestId ?? crypto.randomUUID());
      const discoverer = buildTavilyDiscoverer(requestId);
      return processSourceIngestion(
        { projectId, sourceId, requestId },
        {
          repository: createSupabaseIntakeRepository(),
          events: {
            async sendSourceIngestRequested() {},
            async sendExtractionRequested(projectId, sourceIds, demoMode = false) {
              await inngest.send({
                name: MOTIVE_EVENTS.extractionRequested,
                data: {
                  projectId,
                  sourceIds,
                  demoMode,
                  requestId: crypto.randomUUID()
                }
              });
            }
          },
          discoverer
        }
      );
    });
  }
);

function buildTavilyDiscoverer(requestId: string): BrandDiscoverer {
  const params = buildCrawlRequestParams();
  const limitEnv = Number(process.env.TAVILY_CRAWL_LIMIT);
  const depthEnv = Number(process.env.TAVILY_CRAWL_MAX_DEPTH);
  const searchMaxEnv = Number(process.env.TAVILY_SEARCH_MAX_RESULTS);

  return {
    isConfigured: () => Boolean(process.env.TAVILY_API_KEY),
    async crawl({ brandUrl }) {
      const crawl = await crawlBrandSite({
        url: brandUrl,
        requestId,
        instructions: params.instructions,
        selectPaths: params.selectPaths,
        excludePaths: params.excludePaths,
        maxDepth: Number.isFinite(depthEnv) && depthEnv > 0 ? depthEnv : params.maxDepth,
        limit: Number.isFinite(limitEnv) && limitEnv > 0 ? limitEnv : params.limit,
        extractDepth: params.extractDepth,
        allowExternal: params.allowExternal
      });

      if (crawl.status === "ready" && crawl.data.results.length > 0) {
        const pages = compactCrawlPages(crawl.data.results);
        if (pages.length > 0) {
          return { pages, raw_crawl_response: (crawl.raw as Record<string, unknown>) ?? {} };
        }
      }

      // Crawl returned nothing useful → fall back to a single-page extract on the
      // homepage. Bot-protected or fully JS-rendered sites often need this.
      const basic = await extractUrlWithTavily({ url: brandUrl, requestId, extractDepth: "basic" });
      if (basic.status === "ready" && basic.data.content.trim()) {
        return {
          pages: [
            {
              url: brandUrl,
              pruned_content: pruneScrapedMarkdown(basic.data.content),
              raw_payload: (basic.raw as Record<string, unknown>) ?? {}
            }
          ],
          raw_crawl_response: (crawl.status === "ready" ? (crawl.raw as Record<string, unknown>) : {}) ?? {}
        };
      }
      const advanced = await extractUrlWithTavily({ url: brandUrl, requestId, extractDepth: "advanced" });
      if (advanced.status === "ready" && advanced.data.content.trim()) {
        return {
          pages: [
            {
              url: brandUrl,
              pruned_content: pruneScrapedMarkdown(advanced.data.content),
              raw_payload: (advanced.raw as Record<string, unknown>) ?? {}
            }
          ],
          raw_crawl_response: (crawl.status === "ready" ? (crawl.raw as Record<string, unknown>) : {}) ?? {}
        };
      }

      const failure_reason =
        extractTavilyFailureReason(crawl.status !== "skipped" ? (crawl.raw as unknown) : undefined) ??
        extractTavilyFailureReason((advanced.status !== "skipped" ? (advanced.raw as unknown) : undefined)) ??
        (crawl.status === "failed" ? crawl.reason : undefined) ??
        "tavily_empty_crawl";

      return {
        pages: [],
        raw_crawl_response:
          (crawl.status === "ready" || crawl.status === "failed"
            ? ((crawl.raw as Record<string, unknown>) ?? {})
            : {}),
        failure_reason
      };
    },
    async search({ query, excludeDomains }) {
      const search = await searchBrandContext({
        query,
        requestId,
        maxResults: Number.isFinite(searchMaxEnv) && searchMaxEnv > 0 ? searchMaxEnv : 5,
        excludeDomains
      });
      if (search.status !== "ready") return null;
      const markdown = formatSearchMarkdown(search.data.results, search.data.answer);
      if (!markdown.trim()) return null;
      return { markdown, raw_payload: (search.raw as Record<string, unknown>) ?? {} };
    }
  };
}

function compactCrawlPages(
  results: Array<{ url: string; raw_content?: string | null; rawContent?: string | null; content?: string | null }>
): DiscoveredPage[] {
  const seen = new Set<string>();
  const pages: DiscoveredPage[] = [];
  for (const page of results) {
    const url = page.url;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const content = getTavilyPageContent(page);
    const pruned = pruneScrapedMarkdown(content);
    if (!pruned.trim()) continue;
    pages.push({
      url,
      pruned_content: pruned,
      raw_payload: page as unknown as Record<string, unknown>
    });
  }
  return pages;
}
