import { SetupError } from "@/components/setup-error";
import { IntakeWorkbench } from "@/components/intake-workbench";
import { clientEnv } from "@/lib/env";

export default function IntakePage() {
  return (
    <main className="app-main grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="card-feature">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="kicker">
              Intake
            </p>
            <h1 className="t-h2 mt-3">
              Create a campaign workspace
            </h1>
          </div>
          <span className="tag tag-cyan">
            Demo shell
          </span>
        </div>
        <IntakeWorkbench />
      </section>

      <aside className="card">
        <h2 className="t-h4">
          Runtime setup
        </h2>
        <div className="mt-4">
          <SetupError env={clientEnv} />
        </div>
      </aside>
    </main>
  );
}
