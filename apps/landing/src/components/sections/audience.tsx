import { AUDIENCES } from "@/lib/data";

export function Audience() {
  return (
    <section className="audience" id="audience">
      <div className="section-head">
        <div className="kicker mono">06 / Who it&apos;s for</div>
        <h2 className="h2">Built for companies preparing for AI-native demand capture.</h2>
      </div>
      <div className="aud-grid">
        {AUDIENCES.map((a) => (
          <div key={a.k} className="aud-card">
            <div className="aud-tag">{a.tag}</div>
            <div className="aud-k">{a.k}</div>
            <div className="aud-d">{a.d}</div>
          </div>
        ))}
      </div>
      <div className="aud-not">
        <span className="aud-not-l">{"// not a fit"}</span>
        <span>
          Regulated verticals · companies without a clear offer · &ldquo;generic ad copy&rdquo;
          buyers.
        </span>
      </div>
    </section>
  );
}
