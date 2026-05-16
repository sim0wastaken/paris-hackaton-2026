import type { EnvParseResult, ClientEnv } from "@/lib/env";

import { StatusBadge } from "./status-badge";

export function SetupError({ env }: { env: EnvParseResult<ClientEnv> }) {
  if (env.success) {
    return (
      <div className="callout callout-success">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[var(--acid)]">
            Public Supabase config detected
          </p>
          <StatusBadge status="complete">Ready</StatusBadge>
        </div>
      </div>
    );
  }

  return (
    <div className="callout callout-warn">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--warn)]">
          Setup values missing
        </p>
        <StatusBadge status="blocked">Blocked</StatusBadge>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-[var(--ink-3)]">
        {env.missingKeys.map((key) => (
          <li key={key}>
            <code>{key}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
