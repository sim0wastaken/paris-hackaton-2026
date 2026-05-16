import { STEPS } from "@/lib/data";

export function Workflow() {
  return (
    <section className="workflow" id="workflow">
      <div className="section-head">
        <div className="kicker mono">03 / Workflow</div>
        <h2 className="h2">From website to AI-native acquisition assets.</h2>
      </div>
      <ol className="steps">
        {STEPS.map((s) => (
          <li key={s.n} className="step">
            <div className="step-rail">
              <span className="step-n">{s.n}</span>
            </div>
            <div className="step-body">
              <h3 className="step-t">{s.t}</h3>
              <p className="step-d">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
