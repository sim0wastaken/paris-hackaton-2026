import type { IntakeEventSink, SourceRecord } from "./projects";

export type SourceIngestionRepository = {
  getSource(sourceId: string): Promise<SourceRecord | null>;
  updateSource(sourceId: string, patch: Partial<SourceRecord>): Promise<SourceRecord>;
};

export type UrlExtractor = {
  isConfigured(): boolean;
  extractUrl(url: string): Promise<{
    content: string;
    providerResponse: Record<string, unknown>;
  }>;
};

export async function processSourceIngestion(
  input: { projectId: string; sourceId: string },
  deps: {
    repository: SourceIngestionRepository;
    events: IntakeEventSink;
    extractor: UrlExtractor;
  }
): Promise<SourceRecord> {
  const source = await deps.repository.getSource(input.sourceId);
  if (!source) throw new Error(`Source not found: ${input.sourceId}`);
  if (source.project_id !== input.projectId) {
    throw new Error(`Source ${input.sourceId} does not belong to project ${input.projectId}`);
  }
  if (source.type !== "url") return source;

  if (!source.uri) {
    return deps.repository.updateSource(source.id, {
      status: "failed",
      error: "missing_source_uri"
    });
  }

  if (!deps.extractor.isConfigured()) {
    return deps.repository.updateSource(source.id, {
      status: "skipped",
      error: "tavily_not_configured",
      provider_response_json: {
        skipped: true,
        reason: "TAVILY_API_KEY is not configured"
      }
    });
  }

  await deps.repository.updateSource(source.id, {
    status: "processing",
    error: null
  });

  try {
    const extracted = await deps.extractor.extractUrl(source.uri);
    const content = extracted.content.trim();
    if (!content) {
      return deps.repository.updateSource(source.id, {
        status: "failed",
        error: "tavily_empty_content",
        provider_response_json: extracted.providerResponse
      });
    }

    const processed = await deps.repository.updateSource(source.id, {
      status: "processed",
      raw_text: content,
      extracted_text: content,
      error: null,
      provider_response_json: extracted.providerResponse,
      metadata: {
        ...source.metadata,
        character_count: content.length,
        processed_at: new Date().toISOString()
      }
    });
    await deps.events.sendExtractionRequested(input.projectId, [processed.id], false);
    return processed;
  } catch (error) {
    return deps.repository.updateSource(source.id, {
      status: "failed",
      error: error instanceof Error ? error.message : "tavily_extract_failed",
      provider_response_json: { failed: true }
    });
  }
}
