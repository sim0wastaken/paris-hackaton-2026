import { SAMPLE_ROWS } from "@/lib/data";

export function SampleOutput() {
  return (
    <section className="sample" id="sample">
      <div className="section-head">
        <div className="kicker mono">05 / Sample output</div>
        <h2 className="h2">
          Built for campaign strategy.
          <br />
          <em>Not generic ad copy.</em>
        </h2>
        <p className="sub-lede">
          A row from a real Motive intent map. Every column is something a launch team needs
          and nothing it doesn&apos;t.
        </p>
      </div>
      <div className="sample-card">
        <div className="sample-head mono">
          <div>Buying conversation</div>
          <div>Stage</div>
          <div>Context hint</div>
          <div>Ad group</div>
          <div>Creative angle</div>
          <div>Landing gap</div>
        </div>
        {SAMPLE_ROWS.map((r, i) => (
          <div key={i} className="sample-row">
            <div className="s-cell s-quote">&ldquo;{r.convo}&rdquo;</div>
            <div className="s-cell">
              <span className="s-pill">{r.stage}</span>
            </div>
            <div className="s-cell s-hint">{r.hint}</div>
            <div className="s-cell s-group">{r.group}</div>
            <div className="s-cell s-angle">{r.angle}</div>
            <div className="s-cell s-gap">⚠ {r.gap}</div>
          </div>
        ))}
        <div className="sample-foot mono">
          <span>{"// row 1 of 47 in the live deliverable"}</span>
          <a href="#offer">Request the full sample →</a>
        </div>
      </div>
    </section>
  );
}
