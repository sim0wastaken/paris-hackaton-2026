// Ban console.log / warn / error / info / debug in app code.
//
// See RELIABILITY.md Invariant 8 and docs/design-docs/golden-principles.md R2.
// Remediation: import { log } from "@/lib/motive/log" and call
// log.info({ request_id, ... }, "message").
//
// Allowed exemptions (configured in eslint.config.mjs via `files`/`ignores`):
//   - apps/web/src/lib/motive/log.ts (the logger itself)
//   - scripts/** (Node scripts, not app code)
//   - **/*.test.ts (test output is fine via console)

const FORBIDDEN_METHODS = new Set(["log", "warn", "error", "info", "debug"]);

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban direct console.* calls in app code; use the structured logger.",
      recommended: true,
    },
    schema: [],
    messages: {
      noConsole:
        "Do not call `console.{{method}}` in app code. Import `log` from '@/lib/motive/log' and use log.{{method}}({ request_id, ... }, message). See golden-principles.md R2.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee &&
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.object &&
          callee.object.type === "Identifier" &&
          callee.object.name === "console" &&
          callee.property &&
          callee.property.type === "Identifier" &&
          FORBIDDEN_METHODS.has(callee.property.name)
        ) {
          context.report({
            node: callee,
            messageId: "noConsole",
            data: { method: callee.property.name },
          });
        }
      },
    };
  },
};
