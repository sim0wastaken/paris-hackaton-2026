import { z } from "zod";

export const MAX_EXTRA_CONTEXT_CHARS = 50_000;

export const SEEDED_DEMO_SOURCE_TEXT = [
  "AtlasDesk helps small revenue teams turn Gmail conversations into a lightweight CRM.",
  "Core proof points: live in Gmail by Friday, two-way contact sync, follow-up reminders, and manager visibility without Salesforce overhead.",
  "Primary buyers are founders and revenue leads at 5-50 person B2B teams switching from spreadsheets.",
  "Common objections include migration risk, setup time, pricing clarity, and whether Gmail-native workflows can scale.",
  "Landing gaps to watch: setup proof, integration depth, pricing clarity, migration comparison, and security review material."
].join("\n");

const rawIntakeSchema = z.object({
  brand_url: z.string().trim().min(1, "Brand URL is required"),
  project_name: z.string().trim().optional(),
  extra_context: z
    .string()
    .max(MAX_EXTRA_CONTEXT_CHARS, "Extra context must be 50,000 characters or fewer")
    .optional(),
  product_feed_sample: z.string().optional(),
  demo_mode: z.coerce.boolean().default(false)
});

export type ProjectStatus =
  | "draft"
  | "extracting"
  | "review"
  | "creative_ready"
  | "deployed"
  | "failed";

export type SourceType = "url" | "pdf" | "markdown" | "text" | "screenshot" | "product_feed";
export type SourceStatus =
  | "pending"
  | "processing"
  | "processed"
  | "failed"
  | "skipped"
  | "needs_manual_text";

export type ProjectInsertDraft = {
  name: string;
  brand_url: string;
  status: Extract<ProjectStatus, "draft" | "extracting">;
  extra_context: string | null;
  metadata: Record<string, unknown>;
};

export type SourceInsertDraft = {
  type: Extract<SourceType, "url" | "text" | "markdown" | "product_feed">;
  name: string;
  uri: string | null;
  raw_text: string | null;
  extracted_text: string | null;
  status: Extract<SourceStatus, "pending" | "processed">;
  provider: string | null;
  provider_request_json: Record<string, unknown>;
  provider_response_json: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

export type ProductFeedInsertDraft = {
  name: string;
  status: "processed";
  source_format: "csv" | "jsonl";
  metadata: Record<string, unknown>;
};

export type ProductFeedItemInsertDraft = {
  item_id: string | null;
  title: string | null;
  description: string | null;
  link: string | null;
  image_link: string | null;
  availability: string | null;
  price: string | null;
  brand: string | null;
  google_product_category: string | null;
  product_type: string | null;
  raw_json: Record<string, unknown>;
};

export type ProjectRecord = Omit<ProjectInsertDraft, "status"> & {
  id: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export type SourceRecord = Omit<SourceInsertDraft, "status"> & {
  id: string;
  project_id: string;
  status: SourceStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductFeedRecord = ProductFeedInsertDraft & {
  id: string;
  project_id: string;
  item_count: number;
  created_at: string;
  updated_at: string;
};

export type ProductFeedItemRecord = ProductFeedItemInsertDraft & {
  id: string;
  project_id: string;
  product_feed_id: string;
  review_status: "pending" | "approved" | "edited" | "rejected" | "enriched";
  created_at: string;
  updated_at: string;
};

export type ProjectWorkspace = {
  project: ProjectRecord;
  sources: SourceRecord[];
  product_feeds: ProductFeedRecord[];
  product_feed_items: ProductFeedItemRecord[];
};

export type IntakeRepository = {
  insertProject(project: ProjectInsertDraft): Promise<ProjectRecord>;
  insertSources(projectId: string, sources: SourceInsertDraft[]): Promise<SourceRecord[]>;
  insertProductFeed(
    projectId: string,
    feed: ProductFeedInsertDraft,
    itemCount: number
  ): Promise<ProductFeedRecord>;
  insertProductFeedItems(
    projectId: string,
    feedId: string,
    items: ProductFeedItemInsertDraft[]
  ): Promise<ProductFeedItemRecord[]>;
  appendSource(projectId: string, source: SourceInsertDraft): Promise<SourceRecord>;
  getProjectWorkspace(projectId: string): Promise<ProjectWorkspace | null>;
};

export type IntakeEventSink = {
  sendSourceIngestRequested(projectId: string, sourceId: string): Promise<void>;
  sendExtractionRequested(projectId: string, sourceIds: string[], demoMode?: boolean): Promise<void>;
};

export type InitialIntakeRows = {
  project: ProjectInsertDraft;
  sources: SourceInsertDraft[];
  productFeed: ProductFeedInsertDraft | null;
  productFeedItems: ProductFeedItemInsertDraft[];
};

export function getProjectShell(projectId: string) {
  if (projectId !== "demo-project") return null;

  return {
    id: projectId,
    name: "Demo brand workspace",
    stats: [
      { label: "Sources", value: "0" },
      { label: "Extraction runs", value: "0" },
      { label: "Review rows", value: "0" }
    ]
  };
}

export function normalizeBrandUrl(value: string): string {
  const trimmed = value.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;

  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error("Brand URL must be a valid URL or domain.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Brand URL must use http or https.");
  }

  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.protocol = parsed.protocol.toLowerCase();

  const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
  return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
}

export function buildInitialIntakeRows(input: unknown): InitialIntakeRows {
  const payload = parseProjectIntakePayload(input);
  const hostname = new URL(payload.brand_url).hostname;
  const sources: SourceInsertDraft[] = [
    {
      type: "url",
      name: hostname,
      uri: payload.brand_url,
      raw_text: null,
      extracted_text: null,
      status: "pending",
      provider: "tavily",
      provider_request_json: {},
      provider_response_json: {},
      metadata: {
        normalized_url: payload.brand_url
      }
    }
  ];

  if (payload.extra_context) {
    sources.push({
      type: detectTextSourceType(payload.extra_context),
      name: "Pasted context",
      uri: null,
      raw_text: payload.extra_context,
      extracted_text: payload.extra_context,
      status: "processed",
      provider: null,
      provider_request_json: {},
      provider_response_json: {},
      metadata: {
        character_count: payload.extra_context.length
      }
    });
  }

  if (payload.demo_mode) {
    sources.push(createSeededDemoSource());
  }

  const parsedFeed = payload.product_feed_sample
    ? parseProductFeedSample(payload.product_feed_sample)
    : null;

  if (parsedFeed) {
    sources.push({
      type: "product_feed",
      name: "Pasted product feed",
      uri: null,
      raw_text: payload.product_feed_sample ?? null,
      extracted_text: parsedFeed.summaryText,
      status: "processed",
      provider: null,
      provider_request_json: {},
      provider_response_json: {},
      metadata: {
        format: parsedFeed.format,
        row_count: parsedFeed.items.length
      }
    });
  }

  return {
    project: {
      name: deriveProjectName(payload.brand_url, payload.project_name),
      brand_url: payload.brand_url,
      status: "extracting",
      extra_context: payload.extra_context ?? null,
      metadata: {
        intake: {
          demo_mode: payload.demo_mode,
          has_product_feed: Boolean(parsedFeed)
        }
      }
    },
    sources,
    productFeed: parsedFeed
      ? {
          name: "Pasted product feed",
          status: "processed",
          source_format: parsedFeed.format,
          metadata: {
            row_count: parsedFeed.items.length
          }
        }
      : null,
    productFeedItems: parsedFeed?.items ?? []
  };
}

export async function createProjectIntake(
  input: unknown,
  deps: { repository: IntakeRepository; events: IntakeEventSink }
): Promise<ProjectWorkspace & { redirect_url: string }> {
  const rows = buildInitialIntakeRows(input);
  const project = await deps.repository.insertProject(rows.project);
  const sources = await deps.repository.insertSources(project.id, rows.sources);

  const productFeeds: ProductFeedRecord[] = [];
  let productFeedItems: ProductFeedItemRecord[] = [];
  if (rows.productFeed) {
    const feed = await deps.repository.insertProductFeed(
      project.id,
      rows.productFeed,
      rows.productFeedItems.length
    );
    productFeeds.push(feed);
    productFeedItems = await deps.repository.insertProductFeedItems(
      project.id,
      feed.id,
      rows.productFeedItems
    );
  }

  for (const source of sources) {
    if (source.type === "url" && source.status === "pending") {
      await deps.events.sendSourceIngestRequested(project.id, source.id);
    }
  }

  const usableSourceIds = getUsableSourceIds(sources);
  if (usableSourceIds.length > 0) {
    const demoMode = sources.some((source) => source.metadata.demo === true);
    await deps.events.sendExtractionRequested(project.id, usableSourceIds, demoMode);
  }

  return {
    project,
    sources,
    product_feeds: productFeeds,
    product_feed_items: productFeedItems,
    redirect_url: `/projects/${project.id}/review`
  };
}

export async function addSeededDemoSource(
  projectId: string,
  deps: { repository: IntakeRepository; events: IntakeEventSink }
): Promise<SourceRecord> {
  const source = await deps.repository.appendSource(projectId, createSeededDemoSource());
  await deps.events.sendExtractionRequested(projectId, [source.id], true);
  return source;
}

export function getUsableSourceIds(sources: SourceRecord[]): string[] {
  return sources
    .filter((source) => source.status === "processed" && Boolean((source.extracted_text ?? source.raw_text)?.trim()))
    .map((source) => source.id);
}

export function parseProductFeedSample(sample: string): {
  format: "csv" | "jsonl";
  items: ProductFeedItemInsertDraft[];
  summaryText: string;
} {
  const trimmed = sample.trim();
  if (!trimmed) throw new Error("Product feed sample is empty.");
  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const format = lines.every((line) => line.startsWith("{")) ? "jsonl" : "csv";
  const rawItems = format === "jsonl"
    ? lines.map((line) => parseJsonLine(line))
    : parseCsvRows(trimmed);
  const items = rawItems.map(normalizeProductRow);

  return {
    format,
    items,
    summaryText: buildFeedSummaryText(items)
  };
}

function parseProjectIntakePayload(input: unknown) {
  const parsed = rawIntakeSchema.parse(input);
  return {
    ...parsed,
    brand_url: normalizeBrandUrl(parsed.brand_url),
    project_name: parsed.project_name?.trim() || undefined,
    extra_context: normalizeOptionalText(parsed.extra_context),
    product_feed_sample: normalizeOptionalText(parsed.product_feed_sample)
  };
}

function createSeededDemoSource(): SourceInsertDraft {
  return {
    type: "text",
    name: "Seeded demo source",
    uri: null,
    raw_text: SEEDED_DEMO_SOURCE_TEXT,
    extracted_text: SEEDED_DEMO_SOURCE_TEXT,
    status: "processed",
    provider: null,
    provider_request_json: {},
    provider_response_json: {},
    metadata: {
      demo: true,
      character_count: SEEDED_DEMO_SOURCE_TEXT.length
    }
  };
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function deriveProjectName(url: string, provided?: string): string {
  if (provided) return provided;
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const label = hostname.split(".")[0] || hostname;
  return label
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function detectTextSourceType(text: string): "text" | "markdown" {
  return /(^|\n)\s{0,3}#{1,6}\s|```|\[[^\]]+\]\([^)]+\)|(^|\n)\s*[-*]\s+/m.test(text)
    ? "markdown"
    : "text";
}

function parseJsonLine(line: string): Record<string, unknown> {
  const parsed = JSON.parse(line);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid JSONL product row.");
  }
  return parsed as Record<string, unknown>;
}

function parseCsvRows(csv: string): Record<string, unknown>[] {
  const records = parseCsvRecords(csv);
  const [headers, ...body] = records;
  if (!headers || body.length === 0) {
    throw new Error("CSV product feed requires a header and at least one data row.");
  }
  return body
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header.trim(), row[index]?.trim() ?? ""]))
    );
}

function parseCsvRecords(csv: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      record.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      continue;
    }

    field += char;
  }

  record.push(field);
  records.push(record);
  return records;
}

function normalizeProductRow(row: Record<string, unknown>): ProductFeedItemInsertDraft {
  return {
    item_id: stringField(row, "id") ?? stringField(row, "item_id") ?? stringField(row, "sku"),
    title: stringField(row, "title"),
    description: stringField(row, "description"),
    link: stringField(row, "link"),
    image_link: stringField(row, "image_link"),
    availability: stringField(row, "availability"),
    price: stringField(row, "price"),
    brand: stringField(row, "brand"),
    google_product_category: stringField(row, "google_product_category"),
    product_type: stringField(row, "product_type"),
    raw_json: row
  };
}

function stringField(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  if (value === null || value === undefined) return null;
  const stringValue = String(value).trim();
  return stringValue ? stringValue : null;
}

function buildFeedSummaryText(items: ProductFeedItemInsertDraft[]): string {
  const lines = items.slice(0, 5).map((item, index) => {
    const label = item.title ?? item.item_id ?? `Product ${index + 1}`;
    const details = [item.description, item.price, item.availability, item.product_type]
      .filter(Boolean)
      .join(" | ");
    return details ? `- ${label}: ${details}` : `- ${label}`;
  });
  return `Product feed sample (${items.length} rows)\n${lines.join("\n")}`;
}
