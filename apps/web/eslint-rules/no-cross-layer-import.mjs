// Enforce Motive's layered architecture (see ARCHITECTURE.md § Domain layers).
//
// File-suffix convention:
//   - lib/motive/<domain>.ts         — pure, isomorphic (types + business logic)
//   - lib/motive/<domain>.server.ts  — server data-access (imports "server-only")
//   - lib/motive/<domain>.client.ts  — browser-only helpers (Realtime, etc.)
//
// Allowed import edges:
//   - app/         may import from: components/, lib/motive/<domain>.ts, lib/motive/<domain>.server.ts, lib/supabase/, inngest/
//   - components/  may import from: lib/motive/<domain>.ts, lib/motive/<domain>.client.ts
//   - <domain>.server.ts → lib/supabase/, peer <domain>.server.ts, pure peers
//   - <domain>.client.ts → lib/supabase/browser, pure peers
//   - inngest/     → lib/motive/, lib/supabase/
//
// Disallowed (this rule flags them):
//   - components/        importing *.server.ts, lib/supabase/*, inngest/*
//   - *.client.ts        importing *.server.ts (would drag server code into client bundle)
//   - *.server.ts        importing app/, components/, or *.client.ts (back-edge / bundle leak)

const DISALLOWED = [
  {
    sourceMatcher: /\/src\/components\//,
    importMatcher: /\/lib\/motive\/[^/]+\.server(?:\.ts)?$/,
    message:
      "Components must not import lib/motive/*.server.ts. Use the matching *.client.ts or pure module. See ARCHITECTURE.md § Domain layers.",
  },
  {
    sourceMatcher: /\/src\/components\//,
    importMatcher: /\/lib\/supabase\//,
    message:
      "Components must not import lib/supabase/* directly. Use a domain *.client.ts helper. See ARCHITECTURE.md § Domain layers.",
  },
  {
    sourceMatcher: /\/src\/components\//,
    importMatcher: /\/inngest\//,
    message:
      "Components must not import from inngest/. Send events via a server action or route handler. See ARCHITECTURE.md § Domain layers.",
  },
  {
    sourceMatcher: /\/src\/lib\/motive\/[^/]+\.client\.ts$/,
    importMatcher: /\/lib\/motive\/[^/]+\.server(?:\.ts)?$/,
    message:
      "Client modules (*.client.ts) must not import server modules (*.server.ts) — that would bundle server code into the client. See ARCHITECTURE.md § Domain layers.",
  },
  {
    sourceMatcher: /\/src\/lib\/motive\/[^/]+\.server\.ts$/,
    importMatcher: /\/(app|components)\//,
    message:
      "Data-access layer (*.server.ts) must not import from app/ or components/ — that is a back-edge. See ARCHITECTURE.md § Domain layers.",
  },
  {
    sourceMatcher: /\/src\/lib\/motive\/[^/]+\.server\.ts$/,
    importMatcher: /\/lib\/motive\/[^/]+\.client(?:\.ts)?$/,
    message:
      "Server modules (*.server.ts) must not import client modules (*.client.ts). See ARCHITECTURE.md § Domain layers.",
  },
];

/** @type {import("eslint").Rule.RuleModule} */
const noCrossLayerImport = {
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

export default noCrossLayerImport;
