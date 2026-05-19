import { describe, expect, it, vi } from "vitest";

import {
  type BrandDiscoverer,
  type DiscoveryEvents,
  type DiscoveryRepository,
  discoverBrandSources,
  formatSearchMarkdown
} from "./brand-discovery";
import type { SourceInsertDraft, SourceRecord } from "./projects";

function makeParent(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    id: "src-parent",
    project_id: "proj-1",
    type: "url",
    name: "intarget.net",
    uri: "https://www.intarget.net/",
    raw_text: null,
    extracted_text: null,
    status: "pending",
    provider: "tavily",
    provider_request_json: {},
    provider_response_json: {},
    error: null,
    metadata: { normalized_url: "https://www.intarget.net/" },
    created_at: "2026-05-19T00:00:00Z",
    updated_at: "2026-05-19T00:00:00Z",
    ...overrides
  } as SourceRecord;
}

type RepoState = {
  parent: SourceRecord;
  appended: Array<{ projectId: string; parentSourceId: string; draft: SourceInsertDraft }>;
};

function makeRepo(state: RepoState): DiscoveryRepository {
  return {
    async updateSource(id, patch) {
      if (id !== state.parent.id) throw new Error("unexpected id");
      state.parent = { ...state.parent, ...patch } as SourceRecord;
      return state.parent;
    },
    async appendChildSource(projectId, parentSourceId, draft) {
      state.appended.push({ projectId, parentSourceId, draft });
      return {
        id: `src-child-${state.appended.length}`,
        project_id: projectId,
        type: draft.type,
        name: draft.name,
        uri: draft.uri,
        raw_text: draft.raw_text,
        extracted_text: draft.extracted_text,
        status: draft.status,
        provider: draft.provider,
        provider_request_json: draft.provider_request_json,
        provider_response_json: draft.provider_response_json,
        error: null,
        metadata: { ...draft.metadata, parent_source_id: parentSourceId },
        created_at: "2026-05-19T00:00:00Z",
        updated_at: "2026-05-19T00:00:00Z"
      } as SourceRecord;
    }
  };
}

describe("discoverBrandSources", () => {
  it("skips and marks the parent when Tavily is not configured", async () => {
    const state: RepoState = { parent: makeParent(), appended: [] };
    const repo = makeRepo(state);
    const events: DiscoveryEvents = { sendExtractionRequested: vi.fn() };
    const discoverer: BrandDiscoverer = {
      isConfigured: () => false,
      crawl: vi.fn(),
      search: vi.fn()
    };

    const result = await discoverBrandSources(
      { projectId: "proj-1", parentSource: state.parent, requestId: "req_1" },
      { repository: repo, events, discoverer }
    );

    expect(result.parent.status).toBe("skipped");
    expect(result.parent.error).toBe("tavily_not_configured");
    expect(result.children).toEqual([]);
    expect(result.externalContext).toBeNull();
    expect(events.sendExtractionRequested).not.toHaveBeenCalled();
    expect(discoverer.crawl).not.toHaveBeenCalled();
  });

  it("marks the parent failed if crawl returns no pages", async () => {
    const state: RepoState = { parent: makeParent(), appended: [] };
    const repo = makeRepo(state);
    const events: DiscoveryEvents = { sendExtractionRequested: vi.fn() };
    const discoverer: BrandDiscoverer = {
      isConfigured: () => true,
      crawl: vi.fn().mockResolvedValue({
        pages: [],
        raw_crawl_response: { results: [] },
        failure_reason: "tavily_empty_crawl"
      }),
      search: vi.fn()
    };

    const result = await discoverBrandSources(
      { projectId: "proj-1", parentSource: state.parent, requestId: "req_2" },
      { repository: repo, events, discoverer }
    );

    expect(result.parent.status).toBe("failed");
    expect(result.parent.error).toBe("tavily_empty_crawl");
    expect(events.sendExtractionRequested).not.toHaveBeenCalled();
  });

  it("creates N child sources + external context source and emits extractionRequested with all ids", async () => {
    const state: RepoState = { parent: makeParent(), appended: [] };
    const repo = makeRepo(state);
    const sendExtractionRequested = vi.fn();
    const events: DiscoveryEvents = { sendExtractionRequested };

    const discoverer: BrandDiscoverer = {
      isConfigured: () => true,
      crawl: vi.fn().mockResolvedValue({
        pages: [
          { url: "https://www.intarget.net/", pruned_content: "Customer Journey Consultancy", raw_payload: { url: "https://www.intarget.net/" } },
          { url: "https://www.intarget.net/about", pruned_content: "About Intarget", raw_payload: { url: "https://www.intarget.net/about" } },
          { url: "https://www.intarget.net/solutions", pruned_content: "Solutions: marketing + data + creative", raw_payload: { url: "https://www.intarget.net/solutions" } },
          { url: "https://www.intarget.net/works", pruned_content: "Case studies and works", raw_payload: { url: "https://www.intarget.net/works" } }
        ],
        raw_crawl_response: { results: [], base_url: "https://www.intarget.net/" }
      }),
      search: vi.fn().mockResolvedValue({
        markdown: "External context body",
        raw_payload: { results: [] }
      })
    };

    const result = await discoverBrandSources(
      { projectId: "proj-1", parentSource: state.parent, requestId: "req_3" },
      { repository: repo, events, discoverer }
    );

    expect(result.parent.status).toBe("processed");
    expect(result.parent.extracted_text).toContain("Customer Journey Consultancy");
    expect(result.children).toHaveLength(3);
    expect(result.children.map((c) => c.uri)).toEqual([
      "https://www.intarget.net/about",
      "https://www.intarget.net/solutions",
      "https://www.intarget.net/works"
    ]);
    expect(result.externalContext).not.toBeNull();
    expect(result.externalContext?.type).toBe("markdown");

    expect(sendExtractionRequested).toHaveBeenCalledOnce();
    const [projectId, sourceIds] = sendExtractionRequested.mock.calls[0];
    expect(projectId).toBe("proj-1");
    expect(sourceIds).toHaveLength(5);
    expect(sourceIds[0]).toBe(state.parent.id);
  });

  it("still emits extractionRequested when the external search returns nothing", async () => {
    const state: RepoState = { parent: makeParent(), appended: [] };
    const repo = makeRepo(state);
    const sendExtractionRequested = vi.fn();
    const events: DiscoveryEvents = { sendExtractionRequested };

    const discoverer: BrandDiscoverer = {
      isConfigured: () => true,
      crawl: vi.fn().mockResolvedValue({
        pages: [
          { url: "https://www.intarget.net/", pruned_content: "Homepage copy", raw_payload: {} },
          { url: "https://www.intarget.net/about", pruned_content: "About copy", raw_payload: {} }
        ],
        raw_crawl_response: {}
      }),
      search: vi.fn().mockResolvedValue(null)
    };

    const result = await discoverBrandSources(
      { projectId: "proj-1", parentSource: state.parent, requestId: "req_4" },
      { repository: repo, events, discoverer }
    );

    expect(result.children).toHaveLength(1);
    expect(result.externalContext).toBeNull();
    expect(sendExtractionRequested).toHaveBeenCalledWith("proj-1", [state.parent.id, result.children[0].id], false);
  });

  it("swallows a thrown search error rather than failing the intake", async () => {
    const state: RepoState = { parent: makeParent(), appended: [] };
    const repo = makeRepo(state);
    const sendExtractionRequested = vi.fn();
    const events: DiscoveryEvents = { sendExtractionRequested };

    const discoverer: BrandDiscoverer = {
      isConfigured: () => true,
      crawl: vi.fn().mockResolvedValue({
        pages: [{ url: "https://www.intarget.net/", pruned_content: "Homepage copy", raw_payload: {} }],
        raw_crawl_response: {}
      }),
      search: vi.fn().mockRejectedValue(new Error("search timeout"))
    };

    const result = await discoverBrandSources(
      { projectId: "proj-1", parentSource: state.parent, requestId: "req_5" },
      { repository: repo, events, discoverer }
    );

    expect(result.parent.status).toBe("processed");
    expect(result.externalContext).toBeNull();
    expect(sendExtractionRequested).toHaveBeenCalledOnce();
  });

  it("marks parent failed when uri is missing", async () => {
    const state: RepoState = { parent: makeParent({ uri: null }), appended: [] };
    const repo = makeRepo(state);
    const events: DiscoveryEvents = { sendExtractionRequested: vi.fn() };
    const discoverer: BrandDiscoverer = {
      isConfigured: () => true,
      crawl: vi.fn(),
      search: vi.fn()
    };

    const result = await discoverBrandSources(
      { projectId: "proj-1", parentSource: state.parent, requestId: "req_6" },
      { repository: repo, events, discoverer }
    );

    expect(result.parent.status).toBe("failed");
    expect(result.parent.error).toBe("missing_source_uri");
    expect(discoverer.crawl).not.toHaveBeenCalled();
  });
});

describe("formatSearchMarkdown", () => {
  it("renders title, url, snippet, and synthesized answer", () => {
    const md = formatSearchMarkdown(
      [
        { title: "Intarget on G2", url: "https://g2.com/intarget", content: "Boutique customer journey consultancy.", published_date: "2026-01-10" },
        { title: "Italian agency directory", url: "https://dir.example/intarget", content: "Pisa-based digital marketing partner of Google." }
      ],
      "Intarget is an Italian customer-journey consultancy."
    );
    expect(md).toContain("External context");
    expect(md).toContain("Synthesized answer");
    expect(md).toContain("Intarget on G2");
    expect(md).toContain("g2.com/intarget");
    expect(md).toContain("2026-01-10");
  });
});
