import {
  type BrandDiscoverer,
  discoverBrandSources
} from "./brand-discovery";
import type { IntakeEventSink, SourceInsertDraft, SourceRecord } from "./projects";

export type SourceIngestionRepository = {
  getSource(sourceId: string): Promise<SourceRecord | null>;
  updateSource(sourceId: string, patch: Partial<SourceRecord>): Promise<SourceRecord>;
  appendChildSource(
    projectId: string,
    parentSourceId: string,
    source: SourceInsertDraft
  ): Promise<SourceRecord>;
};

export async function processSourceIngestion(
  input: { projectId: string; sourceId: string; requestId?: string },
  deps: {
    repository: SourceIngestionRepository;
    events: IntakeEventSink;
    discoverer: BrandDiscoverer;
  }
): Promise<SourceRecord> {
  const source = await deps.repository.getSource(input.sourceId);
  if (!source) throw new Error(`Source not found: ${input.sourceId}`);
  if (source.project_id !== input.projectId) {
    throw new Error(`Source ${input.sourceId} does not belong to project ${input.projectId}`);
  }
  if (source.type !== "url") return source;

  try {
    const result = await discoverBrandSources(
      {
        projectId: input.projectId,
        parentSource: source,
        requestId: input.requestId ?? crypto.randomUUID()
      },
      {
        repository: deps.repository,
        events: {
          sendExtractionRequested: deps.events.sendExtractionRequested
        },
        discoverer: deps.discoverer
      }
    );
    return result.parent;
  } catch (error) {
    return deps.repository.updateSource(source.id, {
      status: "failed",
      error: error instanceof Error ? error.message : "tavily_discover_failed",
      provider_response_json: { failed: true }
    });
  }
}
