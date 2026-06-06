import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT } from "./Easing";

// Generic fade+rise reveal. Use for headlines and supporting text blocks.
// Pass `out={{ at, duration }}` for an exit fade too.
export const Reveal: React.FC<{
  delay?: number;
  duration?: number;
  rise?: number;
  out?: { at: number; duration?: number };
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, duration = 18, rise = 14, out, style, children }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const exit = out
    ? interpolate(frame, [out.at, out.at + (out.duration ?? 12)], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_OUT,
      })
    : 1;
  return (
    <div
      style={{
        opacity: enter * exit,
        transform: `translateY(${(1 - enter) * rise}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
