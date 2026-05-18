// Enforce Motive's layered architecture (see ARCHITECTURE.md § Domain layers).
//
// Allowed import edges:
//   - app/         may import from: components/, lib/motive/<domain>.ts, lib/supabase/, inngest/
//   - components/  may import from: lib/motive/<domain>.ts
//   - lib/motive/<domain>.ts → lib/motive/supabase-<domain>.ts, lib/supabase/, inngest/, peers
//   - lib/motive/supabase-<domain>.ts → lib/supabase/, types
//   - inngest/ → lib/motive/, lib/supabase/
//
// Disallowed (this rule flags them):
//   - app/         importing lib/motive/supabase-*.ts directly
//   - components/  importing lib/motive/supabase-*.ts, lib/supabase/*, inngest/*
//   - lib/motive/supabase-*.ts importing app/ or components/
//
// Severity is "warn" by default so legacy code can be migrated incrementally.
// Each violation message references ARCHITECTURE.md § Domain layers.

const DISALLOWED = [
  {
    sourceMatcher: /\/src\/app\//,
    importMatcher: /\/lib\/motive\/supabase-/,
    message:
      "Routes/pages must not import lib/motive/supabase-*.ts directly. Go through lib/motive/<domain>.ts. See ARCHITECTURE.md § Domain layers.",
  },
  {
    sourceMatcher: /\/src\/components\//,
    importMatcher: /\/lib\/motive\/supabase-/,
    message:
      "Components must not import lib/motive/supabase-*.ts directly. Go through lib/motive/<domain>.ts. See ARCHITECTURE.md § Domain layers.",
  },
  {
    sourceMatcher: /\/src\/components\//,
    importMatcher: /\/lib\/supabase\//,
    message:
      "Components must not import lib/supabase/* directly. Use a domain service in lib/motive/. See ARCHITECTURE.md § Domain layers.",
  },
  {
    sourceMatcher: /\/src\/components\//,
    importMatcher: /\/inngest\//,
    message:
      "Components must not import from inngest/. Send events via a server action or route handler. See ARCHITECTURE.md § Domain layers.",
  },
  {
    sourceMatcher: /\/src\/lib\/motive\/supabase-/,
    importMatcher: /\/(app|components)\//,
    message:
      "Data-access layer (lib/motive/supabase-*.ts) must not import from app/ or components/ — that is a back-edge. See ARCHITECTURE.md § Domain layers.",
  },
];

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce Motive's layered architecture import rules.",
      recommended: true,
    },
    schema: [],
    messages: {
      crossLayer: "{{ msg }}",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();

    function check(node, importPath) {
      // Only consider relative or alias paths that resolve into the repo.
      // Skip bare module specifiers like "next/link", "react", etc.
      if (
        !importPath.startsWith(".") &&
        !importPath.startsWith("@/") &&
        !importPath.startsWith("/")
      ) {
        return;
      }
      // Normalize alias `@/foo` to `/src/foo` for matching against repo paths.
      const normalizedImport = importPath.startsWith("@/")
        ? importPath.replace(/^@\//, "/src/")
        : importPath;

      for (const rule of DISALLOWED) {
        if (
          rule.sourceMatcher.test(filename) &&
          rule.importMatcher.test(normalizedImport)
        ) {
          context.report({
            node,
            messageId: "crossLayer",
            data: { msg: rule.message },
          });
          return;
        }
      }
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ImportExpression(node) {
        if (node.source && node.source.type === "Literal" && typeof node.source.value === "string") {
          check(node, node.source.value);
        }
      },
    };
  },
};
