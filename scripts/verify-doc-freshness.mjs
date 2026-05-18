#!/usr/bin/env node
// Verify that source-of-truth docs are in sync with the rest of the repo.
//
// Checks (any failure → non-zero exit):
//   1. `docs/generated/db-schema.md` is not older than the newest migration.
//   2. Every `TODO(blocker: YYYY-MM-DD)` tag in code is referenced in
//      `docs/agent-memory/BLOCKERS.md` (Golden Principle R7).
//   3. Every plan filename under `docs/exec-plans/active/` follows the
//      `YYYY-MM-DD-<slug>.md` shape so the GC agent can sort them.
//
// CI invokes this as `node scripts/verify-doc-freshness.mjs`.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(here, "..");

const problems = [];

// 1. db-schema.md vs migrations.
function checkSchemaFreshness() {
  const migrationsDir = join(repoRoot, "supabase", "migrations");
  const schemaDoc = join(repoRoot, "docs", "generated", "db-schema.md");
  if (!existsSync(schemaDoc)) {
    problems.push(
      `[freshness] docs/generated/db-schema.md is missing — run \`pnpm db:schema:doc\`.`,
    );
    return;
  }
  const schemaMtime = statSync(schemaDoc).mtimeMs;
  let newestMigration = 0;
  for (const name of readdirSync(migrationsDir)) {
    if (!name.endsWith(".sql")) continue;
    const m = statSync(join(migrationsDir, name)).mtimeMs;
    if (m > newestMigration) newestMigration = m;
  }
  if (newestMigration > schemaMtime) {
    problems.push(
      `[freshness] migrations are newer than db-schema.md — run \`pnpm db:schema:doc\`.`,
    );
  }
}

// 2. TODO(blocker: ...) tags in code must be present in BLOCKERS.md.
function checkBlockerTags() {
  const blockersPath = join(repoRoot, "docs", "agent-memory", "BLOCKERS.md");
  const blockersText = existsSync(blockersPath)
    ? readFileSync(blockersPath, "utf8")
    : "";
  const re = /TODO\(blocker:\s*(\d{4}-\d{2}-\d{2})\)/g;

  function walk(dir, files) {
    const skip = new Set([
      "node_modules",
      ".next",
      ".git",
      ".turbo",
      "dist",
      "build",
      ".gitnexus",
      ".claude",
      ".codex",
      ".agents",
      "submission",
    ]);
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p, files);
      else if (
        entry.name.endsWith(".ts") ||
        entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".js") ||
        entry.name.endsWith(".mjs") ||
        entry.name.endsWith(".sql")
      ) {
        files.push(p);
      }
    }
  }
  const codeFiles = [];
  walk(repoRoot, codeFiles);

  const tagsFound = new Map(); // date -> [paths]
  for (const f of codeFiles) {
    const body = readFileSync(f, "utf8");
    for (const m of body.matchAll(re)) {
      const date = m[1];
      if (!tagsFound.has(date)) tagsFound.set(date, []);
      tagsFound.get(date).push(f);
    }
  }

  for (const [date, paths] of tagsFound) {
    if (!blockersText.includes(date)) {
      problems.push(
        `[blockers] TODO(blocker: ${date}) found in ${paths.length} file(s) but no matching entry in BLOCKERS.md — add one.`,
      );
    }
  }
}

// 3. Plan filenames under active/ must be YYYY-MM-DD-<slug>.md.
function checkPlanNames() {
  const activeDir = join(repoRoot, "docs", "exec-plans", "active");
  if (!existsSync(activeDir)) return;
  for (const name of readdirSync(activeDir)) {
    if (name === "README.md" || name.startsWith(".")) continue;
    if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(name)) {
      problems.push(
        `[plans] active plan \`${name}\` does not match YYYY-MM-DD-<slug>.md — rename it.`,
      );
    }
  }
}

checkSchemaFreshness();
checkBlockerTags();
checkPlanNames();

if (problems.length) {
  for (const p of problems) process.stderr.write(`${p}\n`);
  process.exit(1);
}
process.stdout.write("doc freshness OK.\n");
