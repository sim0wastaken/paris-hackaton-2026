"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { SHOWCASE, CHANNEL_BADGES } from "@/lib/data";

function ChannelBadges() {
  return (
    <div className="channel-badges" aria-label="AI channels where your product can appear">
      {CHANNEL_BADGES.map((b, i) => (
        <span
          key={b.k}
          className="cb"
          title={b.t}
          style={{ background: b.c, zIndex: CHANNEL_BADGES.length - i }}
        >
          <span className="cb-glyph">{b.k}</span>
        </span>
      ))}
      <span className="channel-badges-label">live on 4 AI channels</span>
    </div>
  );
}

function ShowcaseStack() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SHOWCASE.length), 5800);
    return () => clearInterval(t);
  }, [paused]);

  const s = SHOWCASE[idx];

  return (
    <div
      className="showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ChannelBadges />
      <div className="showcase-stage">
        <div className="showcase-bubble" key={`b-${idx}`}>
          <span className="sb-arrow" aria-hidden />
          {s.prompt}
        </div>
        <div className="showcase-card" key={`c-${idx}`}>
          <div className="showcase-tag">{s.badge}</div>
          <div
            className="showcase-image"
            style={{ "--tone": s.tone } as CSSProperties}
          >
            <span className="showcase-image-label">{s.name}</span>
          </div>
          <div className="showcase-meta">
            <div className="showcase-name">{s.name}</div>
            <div className="showcase-price">{s.meta}</div>
            <div className="showcase-mark">
              <span className="sm-dot" />
              <span className="sm-t">Recommended by AI</span>
            </div>
          </div>
        </div>
      </div>
      <div className="showcase-dots">
        {SHOWCASE.map((item, i) => (
          <button
            key={item.slot}
            type="button"
            className={"sd " + (i === idx ? "on" : "")}
            onClick={() => {
              setIdx(i);
              setPaused(true);
            }}
            aria-label={item.badge}
          />
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero-split" id="hero">
      <div className="hero-split-inner">
        <div className="hero-l">
          <div className="eyebrow hl-anim" style={{ "--d": "0ms" } as CSSProperties}>
            <span className="ey-dot" /> ChatGPT is the new search bar
          </div>
          <h1 className="display hero-display">
            <span className="hl-line hl-anim" style={{ "--d": "80ms" } as CSSProperties}>
              Get found on ChatGPT.
            </span>
            <span className="hl-line hl-anim" style={{ "--d": "180ms" } as CSSProperties}>
              Sell from the <span className="hl-accent">answer</span>.
            </span>
          </h1>
          <p className="lede hl-anim" style={{ "--d": "340ms" } as CSSProperties}>
            We map the prompts where your product belongs, then ship the campaigns, copy, and
            page fixes that earn the recommendation. Before the channel fills with competitors.
          </p>
          <div
            className="hero-ctas hl-anim"
            style={{ "--d": "440ms" } as CSSProperties}
          >
            <a href="#offer" className="btn btn-primary btn-lg">
              Book a readiness sprint <span className="arr" aria-hidden>→</span>
            </a>
            <a href="#demo" className="btn btn-ghost btn-lg">
              See what we mean
            </a>
          </div>
          <div className="hero-meta">
            <div className="meta-stack">
              <div className="ms-num">5 days</div>
              <div className="ms-cap">end-to-end, founder-led</div>
            </div>
            <div className="meta-divider" />
            <div className="meta-stack">
              <div className="ms-num">30–50</div>
              <div className="ms-cap">prompts mapped per sprint</div>
            </div>
            <div className="meta-divider" />
            <div className="meta-stack">
              <div className="ms-num">May 5</div>
              <div className="ms-cap">OpenAI Ads went self-serve</div>
            </div>
          </div>
        </div>
        <div className="hero-r">
          <ShowcaseStack />
        </div>
      </div>
    </section>
  );
}
