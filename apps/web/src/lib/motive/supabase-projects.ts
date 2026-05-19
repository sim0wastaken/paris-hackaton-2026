import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import type {
  IntakeRepository,
  ProductFeedInsertDraft,
  ProductFeedItemInsertDraft,
  ProductFeedItemRecord,
  ProductFeedRecord,
  ProjectRecord,
  ProjectWorkspace,
  SourceRecord
} from "./projects";
import type { SourceIngestionRepository } from "./source-ingestion";

type SupabaseError = {
  code?: string;
  message?: string;
};

type SupabaseResult = {
  data: unknown;
  error: SupabaseError | null;
};

type UntypedQuery = PromiseLike<SupabaseResult> & {
  eq(column: string, value: string): UntypedQuery;
  insert(value: unknown): UntypedQuery;
  order(column: string): UntypedQuery;
  select(columns?: string): UntypedQuery;
  single(): Promise<SupabaseResult>;
  update(value: unknown): UntypedQuery;
};

type SupabaseAny = {
  from: (table: string) => UntypedQuery;
};

export type SupabaseIntakeRepository = IntakeRepository & SourceIngestionRepository;

export function createSupabaseIntakeRepository(): SupabaseIntakeRepository {
  const supabase: SupabaseAny = createSupabaseServiceRoleClient() as unknown as SupabaseAny;

  return {
    async insertProject(project) {
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
        .select("*")
        .single();
      if (error) throw error;
      return data as ProjectRecord;
    },
    async insertSources(projectId, sources) {
      if (sources.length === 0) return [];
      const { data, error } = await supabase
        .from("sources")
        .insert(sources.map((source) => ({ ...source, project_id: projectId })))
        .select("*");
      if (error) throw error;
      return (data ?? []) as SourceRecord[];
    },
    async insertProductFeed(projectId, feed, itemCount) {
      const { data, error } = await supabase
        .from("product_feeds")
        .insert(toProductFeedRow(projectId, feed, itemCount))
        .select("*")
        .single();
      if (error) throw error;
      return toProductFeedRecord(data as Record<string, unknown>);
    },
    async insertProductFeedItems(projectId, feedId, items) {
      if (items.length === 0) return [];
      const { data, error } = await supabase
        .from("product_feed_items")
        .insert(items.map((item, index) => toProductFeedItemRow(projectId, feedId, item, index)))
        .select("*");
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map(toProductFeedItemRecord);
    },
    async appendSource(projectId, source) {
      const { data, error } = await supabase
        .from("sources")
        .insert({ ...source, project_id: projectId })
        .select("*")
        .single();
      if (error) throw error;
      return data as SourceRecord;
    },
    async appendChildSource(projectId, parentSourceId, source) {
      const { data, error } = await supabase
        .from("sources")
        .insert({ ...source, project_id: projectId, parent_source_id: parentSourceId })
        .select("*")
        .single();
      if (error) throw error;
      return data as SourceRecord;
    },
    async getProjectWorkspace(projectId) {
      return getProjectWorkspaceById(supabase, projectId);
    },
    async getSource(sourceId) {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("id", sourceId)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data as SourceRecord;
    },
    async updateSource(sourceId, patch) {
      const { data, error } = await supabase
        .from("sources")
        .update(toSourcePatch(patch))
        .eq("id", sourceId)
        .select("*")
        .single();
      if (error) throw error;
      return data as SourceRecord;
    }
  };
}

async function getProjectWorkspaceById(
  supabase: SupabaseAny,
  projectId: string
): Promise<ProjectWorkspace | null> {
  const projectResult = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectResult.error) {
    if (projectResult.error.code === "PGRST116") return null;
    throw projectResult.error;
  }

  const [sources, feeds, items] = await Promise.all([
    supabase.from("sources").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("product_feeds").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("product_feed_items").select("*").eq("project_id", projectId).order("created_at")
  ]);

  if (sources.error) throw sources.error;
  if (feeds.error) throw feeds.error;
  if (items.error) throw items.error;

  return {
    project: projectResult.data as ProjectRecord,
    sources: (sources.data ?? []) as SourceRecord[],
    product_feeds: ((feeds.data ?? []) as Array<Record<string, unknown>>).map(toProductFeedRecord),
    product_feed_items: ((items.data ?? []) as Array<Record<string, unknown>>).map(toProductFeedItemRecord)
  };
}

function toProductFeedRow(
  projectId: string,
  feed: ProductFeedInsertDraft,
  itemCount: number
) {
  return {
    project_id: projectId,
    name: feed.name,
    status: feed.status,
    format: feed.source_format,
    item_count: itemCount,
    metadata: feed.metadata
  };
}

function toProductFeedItemRow(
  projectId: string,
  feedId: string,
  item: ProductFeedItemInsertDraft,
  index: number
) {
  const itemId = item.item_id ?? `row-${index + 1}`;
  return {
    project_id: projectId,
    product_feed_id: feedId,
    item_id: itemId,
    title: item.title ?? itemId,
    description: item.description,
    link: item.link,
    image_link: item.image_link,
    availability: item.availability,
    price: item.price,
    brand: item.brand,
    google_product_category: item.google_product_category,
    product_type: item.product_type,
    raw_json: item.raw_json
  };
}

function toProductFeedRecord(row: Record<string, unknown>): ProductFeedRecord {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    name: String(row.name),
    status: row.status as ProductFeedRecord["status"],
    source_format: (row.format ?? "csv") as ProductFeedRecord["source_format"],
    item_count: Number(row.item_count ?? 0),
    metadata: asRecord(row.metadata),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

function toProductFeedItemRecord(row: Record<string, unknown>): ProductFeedItemRecord {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    product_feed_id: String(row.product_feed_id),
    item_id: String(row.item_id),
    title: nullableString(row.title),
    description: nullableString(row.description),
    link: nullableString(row.link),
    image_link: nullableString(row.image_link),
    availability: nullableString(row.availability),
    price: nullableString(row.price),
    brand: nullableString(row.brand),
    google_product_category: nullableString(row.google_product_category),
    product_type: nullableString(row.product_type),
    raw_json: asRecord(row.raw_json),
    review_status: row.review_status as ProductFeedItemRecord["review_status"],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

function toSourcePatch(patch: Partial<SourceRecord>) {
  const allowed: Array<keyof SourceRecord> = [
    "raw_text",
    "extracted_text",
    "status",
    "provider",
    "provider_request_json",
    "provider_response_json",
    "metadata",
    "error"
  ];
  return Object.fromEntries(
    allowed
      .filter((key) => key in patch)
      .map((key) => [key, patch[key]])
  );
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
