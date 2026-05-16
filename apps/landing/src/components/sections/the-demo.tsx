import { SCAN_ROWS, GAP_ROWS } from "@/lib/data";

export function TheDemo() {
  return (
    <section className="demo" id="demo">
      <div className="demo-intro">
        <div className="kicker demo-kicker">01 — The shift, on one prompt</div>
        <h2 className="demo-h2">
          Here&apos;s a sale you didn&apos;t know you <span className="hl-accent">lost</span>.
        </h2>
        <p className="demo-sub">
          A buyer types a prompt. ChatGPT picks three vendors. You aren&apos;t one of them. Walk
          through what just happened — and where Motive intervenes.
        </p>
      </div>

      <div className="demo-step">
        <div className="demo-step-n">01 / The prompt</div>
        <div className="demo-step-body">
          <p className="demo-step-narration">
            A 12-person creative agency, switching off Salesforce, opens ChatGPT.
          </p>
          <div className="demo-prompt">
            <div className="demo-avatar">M</div>
            <div>
              <div className="demo-prompt-text">
                I run a 12-person creative agency. Leads stuck in spreadsheets, Salesforce too
                heavy. I need something cheap, Gmail-friendly, live this week. What should I
                look at?
              </div>
              <div className="demo-prompt-meta">May 12, 2026 · 09:14 CET · gpt-5</div>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-step">
        <div className="demo-step-n">02 / The answer</div>
        <div className="demo-step-body">
          <p className="demo-step-narration">Four seconds later, the assistant replies.</p>
          <div className="demo-answer-wrap">
            <div className="demo-answer">
              <div className="demo-answer-head">
                <span className="demo-answer-badge">Assistant</span>
                <span className="demo-answer-time">4.2s · 412 tokens · 3 sources cited</span>
              </div>
              <div className="demo-answer-body">
                <p>For a small creative agency switching off Salesforce, three options stand out:</p>
                <ol>
                  <li>
                    <strong>Attio</strong> — <span className="hl">Gmail-native</span>, modern
                    data model, deploys this week. Closest match to your team size and timeline.
                  </li>
                  <li>
                    <strong>Folk</strong> — Built for relationship-driven work, with a{" "}
                    <span className="hl cyan">light learning curve</span>.
                  </li>
                  <li>
                    <strong>Pipedrive</strong> — More traditional, but{" "}
                    <span className="hl">Gmail-friendly</span> with strong setup docs.
                  </li>
                </ol>
                <p>If you want pure speed, Attio is the closest match to your brief.</p>
              </div>
            </div>
            <aside className="demo-annotations">
              <div className="demo-ann">
                <div className="demo-ann-k">3 competitors named</div>
                <div className="demo-ann-v">
                  None of them are you. The shortlist is written. The first 40% of the decision
                  is already over.
                </div>
              </div>
              <div className="demo-ann cyan">
                <div className="demo-ann-k">Proof points AI used</div>
                <div className="demo-ann-v">
                  Gmail integration. Speed of deployment. Learning curve. Your page has weak
                  signal on all three.
                </div>
              </div>
              <div className="demo-ann">
                <div className="demo-ann-k">No links shown</div>
                <div className="demo-ann-v">
                  The buyer doesn&apos;t compare ten tabs anymore. They take the shortlist. SEO
                  doesn&apos;t save you here.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="demo-step">
        <div className="demo-step-n">03 / The pattern</div>
        <div className="demo-step-body">
          <p className="demo-step-narration">
            This wasn&apos;t one prompt. Across <strong>1,240 prompts</strong> in your category —
            here&apos;s who gets named.
          </p>
          <div className="demo-scan">
            {SCAN_ROWS.map((r) => (
              <div key={r.k} className={"demo-scan-row " + (r.you ? "is-you" : "")}>
                <div className="demo-scan-row-k">{r.k}</div>
                <div className="demo-scan-bar">
                  <span style={{ width: r.v + "%" }} />
                </div>
                <div className="demo-scan-row-v">{r.v}%</div>
              </div>
            ))}
          </div>
          <p className="demo-step-foot">
            You appear in 12% of prompts that match your ICP. The top competitor appears in 71%.
            That gap is the auction&apos;s starting price — paid in attention, before any media
            spend.
          </p>
        </div>
      </div>

      <div className="demo-step">
        <div className="demo-step-n">04 / The gaps</div>
        <div className="demo-step-body">
          <p className="demo-step-narration">
            Here&apos;s what AI couldn&apos;t find on your page — and why it didn&apos;t bother
            mentioning you.
          </p>
          <div className="demo-gaps">
            {GAP_ROWS.map((g) => (
              <div key={g.k} className="demo-gap">
                <div className="demo-gap-bar" style={{ width: Math.max(g.v, 4) + "%" }} />
                <div className="demo-gap-k">{g.k}</div>
                <div className="demo-gap-v">{g.v}% present</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="demo-step demo-step-last">
        <div className="demo-step-n">05 / Where Motive operates</div>
        <div className="demo-step-body">
          <p className="demo-step-narration">
            <strong>Three places. Five days.</strong> One launch-ready map.
          </p>
          <div className="demo-ops">
            <article className="demo-op">
              <div className="demo-op-ref">↑ at step 01</div>
              <h3 className="demo-op-k">Map the prompts.</h3>
              <div className="demo-op-vis demo-op-vis-prompts">
                <div className="dopv-prompt">&ldquo;…warm sweater in green under $200&rdquo;</div>
                <div className="dopv-prompt">&ldquo;…CRM for a 12-person agency&rdquo;</div>
                <div className="dopv-prompt">&ldquo;…hybrid SUV under €40k for a family&rdquo;</div>
                <div className="dopv-prompt dim">+ 27 more, clustered by job</div>
              </div>
              <p className="demo-op-d">
                We surface the 30–50 prompts your product belongs in. Clustered by job,
                constraint, decision stage.
              </p>
            </article>
            <article className="demo-op">
              <div className="demo-op-ref">↑ at step 02</div>
              <h3 className="demo-op-k">Earn the mention.</h3>
              <div className="demo-op-vis demo-op-vis-mention">
                <div className="dopv-mention">
                  For a small creative agency, three options stand out:{" "}
                  <span className="dopv-hl">YourBrand</span>, Attio, and Folk…
                </div>
                <div className="dopv-mention-meta">
                  <span className="dopv-dot" /> mentioned in <strong>1st position</strong>
                </div>
              </div>
              <p className="demo-op-d">
                Context signals, ad-group structure, and copy angles AI surfaces inside the
                conversation. Not Google Ads in a new dashboard.
              </p>
            </article>
            <article className="demo-op">
              <div className="demo-op-ref">↑ at step 04</div>
              <h3 className="demo-op-k">Fix the page.</h3>
              <div className="demo-op-vis demo-op-vis-page">
                <div className="dopv-page-row done">
                  <span className="dopv-mark">✓</span>Setup proof (Gmail flow)
                </div>
                <div className="dopv-page-row done">
                  <span className="dopv-mark">✓</span>Migration story
                </div>
                <div className="dopv-page-row done">
                  <span className="dopv-mark">✓</span>Sub-€50 pricing
                </div>
                <div className="dopv-page-row done">
                  <span className="dopv-mark">✓</span>5-min onboarding
                </div>
              </div>
              <p className="demo-op-d">
                Per-prompt rewrite specs. Proof, structure, tracking, measurement set up before
                the spend.
              </p>
            </article>
          </div>
          <div className="demo-cta-wrap">
            <a href="#offer" className="btn btn-primary btn-lg">
              Book a readiness sprint <span className="arr" aria-hidden>→</span>
            </a>
            <span className="demo-cta-fine">5 sprints / month · cohort opens May 18</span>
          </div>
        </div>
      </div>
    </section>
  );
}
