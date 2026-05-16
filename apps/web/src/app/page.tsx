import { SetupError } from "@/components/setup-error";
import { IntakeWorkbench } from "@/components/intake-workbench";
import { clientEnv } from "@/lib/env";

export default function IntakePage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[#0f7a52]">
              Intake
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#17201c]">
              Create a campaign workspace
            </h1>
          </div>
          <span className="rounded-md border border-[#d9dfd8] px-2.5 py-1 text-xs text-[#66706b]">
            Demo shell
          </span>
        </div>
        <IntakeWorkbench />
      </section>

      <aside className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#17201c]">
          Runtime setup
        </h2>
        <div className="mt-4">
          <SetupError env={clientEnv} />
        </div>
      </aside>
    </main>
  );
}
