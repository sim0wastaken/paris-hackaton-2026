import type { EnvParseResult, ClientEnv } from "@/lib/env";

import { StatusBadge } from "./status-badge";

export function SetupError({ env }: { env: EnvParseResult<ClientEnv> }) {
  if (env.success) {
    return (
      <div className="rounded-md border border-[#b9d8c8] bg-[#eef8f1] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[#0f7a52]">
            Public Supabase config detected
          </p>
          <StatusBadge status="complete">Ready</StatusBadge>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-[#e3d1af] bg-[#fff7e8] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#9b6419]">
          Setup values missing
        </p>
        <StatusBadge status="blocked">Blocked</StatusBadge>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-[#66706b]">
        {env.missingKeys.map((key) => (
          <li key={key}>
            <code>{key}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
