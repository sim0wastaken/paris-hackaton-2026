"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  HEADLINES,
  HEADLINE_KEYS,
  HEADLINE_LABELS,
  ROTATE_MS,
  type HeadlineKey,
} from "@/lib/data";

export function HeadlineRotator() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % HEADLINE_KEYS.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [paused, idx, reducedMotion]);

  const activeKey: HeadlineKey = HEADLINE_KEYS[idx];
  const h = HEADLINES[activeKey];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hl-stage" key={activeKey}>
        <div
          className="eyebrow hl-anim"
          style={{ "--d": "0ms" } as CSSProperties}
        >
          <span className="ey-dot"></span> {h.eyebrow}
        </div>
        <h1 className="display">
          {h.h1.map((line, i) => (
            <span
              key={i}
              className={`hl-line hl-anim ${i === h.h1.length - 1 ? "hl-accent" : ""}`}
              style={{ "--d": `${80 + i * 90}ms` } as CSSProperties}
            >
              {line}
            </span>
          ))}
        </h1>
        <p
          className="lede hl-anim"
          style={{ "--d": `${140 + h.h1.length * 90}ms` } as CSSProperties}
        >
          {h.sub}
        </p>
      </div>

      <div className="hl-rotator">
        {HEADLINE_KEYS.map((k, i) => {
          const isActive = i === idx;
          const fillStyle: CSSProperties =
            !reducedMotion && !paused && isActive
              ? { animation: `hlrFill ${ROTATE_MS}ms linear forwards` }
              : { width: i < idx || isActive ? "100%" : "0%" };
          return (
            <button
              key={k}
              type="button"
              className={`hlr-dot ${isActive ? "is-active" : ""}`}
              onClick={() => {
                setIdx(i);
                setPaused(true);
              }}
              aria-label={HEADLINE_LABELS[k]}
            >
              <span className="hlr-label">{HEADLINE_LABELS[k]}</span>
              <span className="hlr-track">
                <span className="hlr-fill" style={fillStyle} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
