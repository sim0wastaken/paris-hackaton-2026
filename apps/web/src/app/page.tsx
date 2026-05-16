// Intake placeholder. Real submit + Tavily ingestion lands in Spec 03.
export default function IntakePage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">01 / Intake</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
        Drop a brand link to start.
      </h1>
      <p className="mt-4 max-w-prose text-base text-zinc-400">
        Motive ingests the brand, streams OpenAI extraction phases into the review workspace, and
        produces campaign-ready ad groups, creatives, and an OpenAI Ads-compatible export.
      </p>

      <form className="mt-10 space-y-6" aria-label="Project intake (placeholder)">
        <div>
          <label htmlFor="brand_url" className="block text-sm font-medium text-zinc-200">
            Brand URL
          </label>
          <input
            id="brand_url"
            name="brand_url"
            type="url"
            placeholder="https://example.com"
            disabled
            className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-zinc-500">Submit wiring lands with Spec 03.</p>
        </div>

        <div>
          <label htmlFor="extra_context" className="block text-sm font-medium text-zinc-200">
            Extra context (optional)
          </label>
          <textarea
            id="extra_context"
            name="extra_context"
            rows={6}
            placeholder="Positioning notes, pasted product copy, sales-call snippets…"
            disabled
            className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start extraction
        </button>
      </form>

      <div className="mt-16 grid gap-4 border-t border-zinc-800 pt-8 text-sm text-zinc-500 md:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-600">Scaffold status</p>
          <p className="mt-2">
            Foundation layer is live: env validation, Supabase + Inngest + OpenAI/Tavily/fal clients, workflow shell.
            Feature implementation follows the specs under <code className="font-mono">docs/superpowers/specs/</code>.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-600">Next up</p>
          <p className="mt-2">
            Spec 02 — database migrations · Spec 03 — intake wiring · Spec 04 — streaming OpenAI extraction.
          </p>
        </div>
      </div>
    </section>
  );
}
