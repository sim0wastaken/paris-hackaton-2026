import { SetupError } from "@/components/setup-error";
import { IntakeWorkbench } from "@/components/intake-workbench";
import { clientEnv } from "@/lib/env";

export default function IntakePage() {
  return (
    <main className="app-main workspace-split with-aside">
      <section className="card-feature">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker">Intake</p>
            <h1 className="t-h2 mt-3">Create a campaign workspace</h1>
          </div>
          <span className="tag tag-cyan">Demo shell</span>
        </div>
        <IntakeWorkbench />
      </section>

      <aside className="card">
        <h2 className="t-h4">Runtime setup</h2>
        <div className="mt-4">
          <SetupError env={clientEnv} />
        </div>
      </aside>
    </main>
  );
}
