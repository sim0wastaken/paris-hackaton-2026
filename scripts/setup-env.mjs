#!/usr/bin/env node
// Bootstrap apps/web/.env.local from .env.example, filling Supabase keys from
// the running local stack. Idempotent — refuses to overwrite an existing
// .env.local without --force.
//
// Usage: pnpm setup:env [--force]

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const envExamplePath = join(repoRoot, ".env.example");
const envLocalPath = join(repoRoot, "apps", "web", ".env.local");

const force = process.argv.includes("--force");

if (!existsSync(envExamplePath)) {
  console.error(`Missing ${envExamplePath}`);
  process.exit(1);
}

if (existsSync(envLocalPath) && statSync(envLocalPath).size > 0 && !force) {
  console.error(`Refusing to overwrite existing ${envLocalPath}. Pass --force to replace it.`);
  process.exit(1);
}

const status = readSupabaseStatus();
const template = readFileSync(envExamplePath, "utf8");

const replacements = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY ?? status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  DATABASE_URL: status.DB_URL
};

const filled = template
  .split("\n")
  .map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) return line;
    const key = match[1];
    if (replacements[key]) return `${key}=${replacements[key]}`;
    return line;
  })
  .join("\n");

writeFileSync(envLocalPath, filled);
console.log(`Wrote ${envLocalPath}`);
console.log("Fill in any remaining `replace_me` values (OpenAI, Inngest, etc.) before running pnpm dev.");

function readSupabaseStatus() {
  let output;
  try {
    output = execFileSync("pnpm", ["exec", "supabase", "status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (caught) {
    console.error("`supabase status` failed. Is the local stack running? Try `pnpm db:start` first.");
    console.error(caught.stderr?.toString() ?? caught.message);
    process.exit(1);
  }
  const result = {};
  for (const line of output.split("\n")) {
    const match = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (match) result[match[1]] = match[2];
  }
  if (!result.API_URL || !result.SERVICE_ROLE_KEY) {
    console.error("`supabase status -o env` did not return API_URL/SERVICE_ROLE_KEY. Output was:");
    console.error(output);
    process.exit(1);
  }
  return result;
}
