import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const migrationPath = join(root, "supabase/migrations/202605160001_motive_core.sql");
const seedPath = join(root, "supabase/seed.sql");
const typesPath = join(root, "apps/web/src/lib/motive/types.ts");

const tables = [
  "projects",
  "sources",
  "extraction_runs",
  "brand_features",
  "conversations",
  "landing_gaps",
  "campaigns",
  "ad_groups",
  "creative_variants",
  "human_reviews",
  "deployments",
  "performance_snapshots",
  "product_feeds",
  "product_feed_items",
];

const childTables = tables.filter((table) => table !== "projects");

const enums = {
  project_status: ["draft", "extracting", "review", "creative_ready", "deployed", "failed"],
  source_type: ["url", "pdf", "markdown", "text", "screenshot", "product_feed"],
  source_status: ["pending", "processing", "processed", "failed", "skipped", "needs_manual_text"],
  extraction_phase: [
    "source_recap",
    "feature_map",
    "conversation_map",
    "intent_classification",
    "landing_gaps",
    "ad_groups",
    "creative_text",
    "monitoring_synthesis",
  ],
  run_status: ["queued", "running", "succeeded", "failed", "cancelled"],
  review_status: ["pending", "approved", "edited", "rejected", "enriched"],
  feature_type: ["feature", "value_prop", "usp", "use_case", "proof_point", "objection"],
  review_entity_type: [
    "extraction_run",
    "brand_feature",
    "conversation",
    "landing_gap",
    "campaign",
    "ad_group",
    "creative_variant",
    "performance_snapshot",
  ],
  review_action: ["approve", "edit", "reject", "enrich"],
  ad_group_status: ["draft", "approved", "creative_generated", "deployed", "rejected"],
  campaign_objective: ["Views", "Clicks"],
  campaign_status: ["draft", "approved", "deployed", "rejected"],
  creative_asset_type: ["image", "video", "none"],
  asset_generation_status: ["not_requested", "pending", "skipped", "ready", "failed"],
  creative_status: ["draft", "approved", "rejected", "archived"],
  deployment_status: ["fake_deployed", "failed"],
  performance_snapshot_kind: ["simulated", "imported"],
  product_feed_status: ["draft", "uploaded", "processed", "failed", "export_ready"],
};

const requiredProviderJsonFields = {
  sources: ["provider_request_json", "provider_response_json"],
  extraction_runs: ["input_json", "output_json"],
  creative_variants: ["provider_request_json", "provider_response_json", "openai_validation_json"],
  performance_snapshots: ["provider_request_json", "provider_response_json", "metric_basis_json"],
};

const typeExports = [
  "projectStatusValues",
  "sourceTypeValues",
  "extractionPhaseValues",
  "reviewStatusValues",
  "reviewActionValues",
  "projectSchema",
  "sourceSchema",
  "extractionRunSchema",
  "brandFeatureSchema",
  "conversationSchema",
  "landingGapSchema",
  "campaignSchema",
  "adGroupSchema",
  "creativeVariantSchema",
  "humanReviewSchema",
  "deploymentSchema",
  "performanceSnapshotSchema",
  "productFeedSchema",
  "productFeedItemSchema",
  "openAiAdsExportSchema",
  "type Project",
  "type PerformanceSnapshot",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readRequired(path) {
  assert(existsSync(path), `Missing required file: ${path}`);
  return readFileSync(path, "utf8");
}

function normalize(sql) {
  return sql.replace(/\s+/g, " ").toLowerCase();
}

function tableBlock(sql, table) {
  const pattern = new RegExp(`create table\\s+(?:if not exists\\s+)?(?:public\\.)?${table}\\s*\\(([\\s\\S]*?)\\n\\);`, "i");
  const match = sql.match(pattern);
  assert(match, `Missing create table statement for ${table}`);
  return match[1];
}

function enumBlock(sql, enumName) {
  const pattern = new RegExp(`create type\\s+(?:public\\.)?${enumName}\\s+as enum\\s*\\(([\\s\\S]*?)\\);`, "i");
  const match = sql.match(pattern);
  assert(match, `Missing enum ${enumName}`);
  return match[1];
}

function verifyMigration(sql) {
  const lower = normalize(sql);

  assert(lower.includes("create extension if not exists pgcrypto"), "Migration must enable pgcrypto");
  assert(lower.includes("create or replace function public.set_updated_at()"), "Migration must define public.set_updated_at()");
  assert(lower.includes("set search_path = ''"), "public.set_updated_at() must pin search_path");

  for (const [enumName, values] of Object.entries(enums)) {
    const block = enumBlock(sql, enumName);
    for (const value of values) {
      assert(block.includes(`'${value}'`), `Enum ${enumName} missing value ${value}`);
    }
  }

  for (const table of tables) {
    const block = normalize(tableBlock(sql, table));
    assert(block.includes("id uuid primary key default gen_random_uuid()"), `${table} missing UUID primary key`);
    assert(block.includes("created_at timestamptz not null default now()"), `${table} missing created_at timestamp`);
    assert(block.includes("updated_at timestamptz not null default now()"), `${table} missing updated_at timestamp`);
    assert(lower.includes(`alter table public.${table} enable row level security`), `${table} missing RLS enablement`);
    assert(lower.includes(`create trigger ${table}_set_updated_at`), `${table} missing updated_at trigger`);
    assert(lower.includes(`alter publication supabase_realtime add table public.${table}`), `${table} missing realtime publication`);
  }

  for (const table of childTables) {
    const block = normalize(tableBlock(sql, table));
    assert(block.includes("project_id uuid not null references public.projects(id) on delete cascade"), `${table} missing project FK`);
    assert(lower.includes(`create policy ${table}_select_project_access`), `${table} missing SELECT policy`);
    assert(lower.includes(`create policy ${table}_insert_project_access`), `${table} missing INSERT policy`);
    assert(lower.includes(`create policy ${table}_update_project_access`), `${table} missing UPDATE policy`);
    assert(lower.includes(`create index ${table}_project_created_idx`), `${table} missing project_created index`);
  }

  assert(lower.includes("create policy projects_select_access"), "projects missing SELECT policy");
  assert(lower.includes("create policy projects_insert_access"), "projects missing INSERT policy");
  assert(lower.includes("create policy projects_update_access"), "projects missing UPDATE policy");

  for (const [table, fields] of Object.entries(requiredProviderJsonFields)) {
    const block = normalize(tableBlock(sql, table));
    for (const field of fields) {
      assert(block.includes(`${field} jsonb not null default`), `${table}.${field} must be required JSONB with a default`);
    }
  }

  assert(normalize(tableBlock(sql, "performance_snapshots")).includes("quality_score integer not null check (quality_score >= 1 and quality_score <= 100)"), "performance_snapshots must enforce 1-100 quality_score");
  assert(!lower.includes("snapshot_date"), "Migration must not add non-canonical snapshot_date");
  assert(!lower.includes("period_label"), "Migration must not add non-canonical period_label");
}

function verifySeed(seed) {
  const lower = normalize(seed);
  assert(lower.includes("motive-demo"), "Seed must include demo_slug motive-demo");
  for (const table of tables) {
    assert(lower.includes(`insert into public.${table}`), `Seed must insert into ${table}`);
  }
  assert((seed.match(/quality_score/g) ?? []).length >= 6, "Seed should include at least six story KPI snapshots");
  assert(lower.includes("specific") && lower.includes("pricing") && lower.includes("proof"), "Seed narrative should cover specificity, pricing, and proof");
}

function verifyTypes(types) {
  assert(types.includes('from "zod"'), "types.ts must import from zod");
  for (const exportedName of typeExports) {
    assert(types.includes(`export const ${exportedName}`) || types.includes(`export ${exportedName}`), `types.ts missing export ${exportedName}`);
  }
  for (const value of enums.extraction_phase) {
    assert(types.includes(`"${value}"`), `types.ts missing extraction phase ${value}`);
  }
  assert(types.includes("z.uuid()"), "types.ts should validate UUID fields");
  assert(types.includes("qualityScore") && types.includes(".min(1)") && types.includes(".max(100)"), "types.ts must validate qualityScore as 1-100");
}

const migration = readRequired(migrationPath);
const seed = readRequired(seedPath);
const types = readRequired(typesPath);

verifyMigration(migration);
verifySeed(seed);
verifyTypes(types);

console.log("Spec 2 schema contract verified.");
