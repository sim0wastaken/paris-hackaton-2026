"use client";

import { useState } from "react";
import { DASH_CONVERSATIONS } from "@/lib/data";

export function DashboardMock() {
  const [active, setActive] = useState(1);
  const c = DASH_CONVERSATIONS[active];

  return (
    <div className="hero-dash">
      <div className="dash-chrome">
        <div className="dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="dash-url">
          <span className="lock">●</span> motive.app / workspace / acme-crm / intent-map
        </div>
        <div className="dash-meta">
          <span className="pulse"></span> live
        </div>
      </div>

      <div className="dash-grid">
        <aside className="dash-side">
          <div className="side-section">
            <div className="side-label">Source</div>
            <div className="side-row">
              <span className="kbd">URL</span>
              <span className="mono">acmecrm.io</span>
            </div>
            <div className="side-row">
              <span className="kbd">ICP</span>
              <span>7–25 person agencies</span>
            </div>
            <div className="side-row">
              <span className="kbd">Geo</span>
              <span>US · CA · UK</span>
            </div>
          </div>
          <div className="side-section">
            <div className="side-label">Competitors</div>
            <div className="chip-row">
              <span className="chip">HubSpot</span>
              <span className="chip">Pipedrive</span>
              <span className="chip">Attio</span>
              <span className="chip dim">+ 3</span>
            </div>
          </div>
        </aside>

        <main className="dash-main">
          <div className="dash-tabs">
            <span className="tab active">Conversations</span>
            <span className="tab">Ad groups</span>
            <span className="tab">Creative</span>
            <span className="tab">Landing</span>
            <span className="tab-num">24</span>
          </div>

          <ul className="convo-list">
            {DASH_CONVERSATIONS.map((cc, i) => (
              <li
                key={i}
                className={`convo ${i === active ? "is-active" : ""}`}
                onClick={() => setActive(i)}
              >
                <div className="convo-quote">&ldquo;{cc.title}&rdquo;</div>
                <div className="convo-meta">
                  <span className="meta-pill">{cc.stage}</span>
                  <span className="meta-dot"></span>
                  <span className="meta-faint">match {cc.score}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="convo-detail">
            <div className="cd-row">
              <div className="cd-label">Recommended ad group</div>
              <div className="cd-value">{c.group}</div>
            </div>
            <div className="cd-row">
              <div className="cd-label">Context hint</div>
              <code className="cd-value cd-mono">{`{ "topic": "${c.group.toLowerCase()}", "intent": "${c.stage.toLowerCase()}", "audience": "founders & ops at small teams" }`}</code>
            </div>
            <div className="cd-row">
              <div className="cd-label">Landing page gap</div>
              <div className="cd-value cd-warn">⚠ {c.gap}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
