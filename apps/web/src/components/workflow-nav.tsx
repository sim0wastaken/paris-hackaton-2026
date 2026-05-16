import Link from "next/link";

export type WorkflowStepKey = "intake" | "review" | "creatives" | "monitoring";
export type WorkflowStepState = "available" | "current" | "blocked" | "complete" | "failed";

export type WorkflowStep = {
  key: WorkflowStepKey;
  label: string;
  href: string;
  state: WorkflowStepState;
};

export const DEFAULT_STEPS: WorkflowStep[] = [
  { key: "intake", label: "Intake", href: "/", state: "current" },
  { key: "review", label: "Extraction / Review", href: "/review", state: "blocked" },
  { key: "creatives", label: "Creatives", href: "/creatives", state: "blocked" },
  { key: "monitoring", label: "Monitoring", href: "/monitoring", state: "blocked" },
];

const STATE_STYLES: Record<WorkflowStepState, string> = {
  available: "text-zinc-300 hover:text-white",
  current: "text-white font-medium underline underline-offset-4 decoration-2 decoration-white",
  blocked: "text-zinc-600 cursor-not-allowed",
  complete: "text-emerald-400 hover:text-emerald-300",
  failed: "text-red-400 hover:text-red-300",
};

export function WorkflowNav({ steps = DEFAULT_STEPS }: { steps?: WorkflowStep[] }) {
  return (
    <nav className="border-b border-zinc-800 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3 text-sm">
        <Link href="/" className="font-mono text-base text-white">
          Motive
        </Link>
        <ol className="flex flex-1 items-center gap-1">
          {steps.map((s, idx) => {
            const isBlocked = s.state === "blocked";
            const content = (
              <span className={`px-3 py-1 ${STATE_STYLES[s.state]}`}>
                <span className="mr-2 font-mono text-xs text-zinc-500">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                {s.label}
              </span>
            );
            return (
              <li key={s.key} className="flex items-center">
                {isBlocked ? (
                  <span aria-disabled className={STATE_STYLES[s.state]}>
                    {content}
                  </span>
                ) : (
                  <Link href={s.href}>{content}</Link>
                )}
                {idx < steps.length - 1 && <span className="text-zinc-700">/</span>}
              </li>
            );
          })}
        </ol>
        <span className="font-mono text-xs text-zinc-500">v0.0.1 · hackathon demo</span>
      </div>
    </nav>
  );
}
