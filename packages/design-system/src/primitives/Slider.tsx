"use client";

import * as React from "react";
import {
  Label as RACLabel,
  Slider as RACSlider,
  SliderOutput as RACSliderOutput,
  SliderThumb as RACSliderThumb,
  SliderTrack as RACSliderTrack,
  type SliderProps as RACSliderProps,
} from "react-aria-components";
import { cn } from "../cn";

export interface SliderProps extends Omit<RACSliderProps, "className" | "children"> {
  label?: React.ReactNode;
  className?: string;
  showValue?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ label, className, showValue = true, formatOptions, ...props }, ref) => (
    <RACSlider
      ref={ref}
      className={cn("motive-slider", className)}
      formatOptions={formatOptions}
      {...props}
    >
      {(label || showValue) && (
        <>
          {label ? <RACLabel className="field-label">{label}</RACLabel> : <span />}
          {showValue ? (
            <RACSliderOutput className="font-mono text-[var(--ink-3)] text-xs tracking-widest uppercase tabular-nums">
              {({ state }) => state.values.map((value) => state.getThumbValueLabel(state.values.indexOf(value))).join(" – ")}
            </RACSliderOutput>
          ) : null}
        </>
      )}
      <RACSliderTrack className="motive-slider-track">
        {({ state }) => (
          <>
            <span
              className="motive-slider-fill"
              style={{
                left: `${state.getThumbPercent(0) * 100}%`,
                width:
                  state.values.length > 1
                    ? `${(state.getThumbPercent(1) - state.getThumbPercent(0)) * 100}%`
                    : `${state.getThumbPercent(0) * 100}%`,
                ...(state.values.length === 1 ? { left: 0 } : {}),
              }}
            />
            {state.values.map((_, i) => (
              <RACSliderThumb key={i} index={i} className="motive-slider-thumb" />
            ))}
          </>
        )}
      </RACSliderTrack>
    </RACSlider>
  ),
);
Slider.displayName = "Slider";
