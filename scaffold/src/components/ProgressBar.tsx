import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT_STACK } from "../theme";
import { EASE_OUT } from "./Easing";

// 4-stage progress bar pinned to the bottom of every scene. Pass the
// `activeStage` for the scene; pass `revealStartFrame` on the FIRST scene
// to stagger the bar's entry. Edit STAGES below for your video.
export const STAGES = [
  "Setup",
  "Build",
  "Demo",
  "Wrap",
] as const;

const STAGGER = 8;
const ENTRY_DUR = 12;

export const ProgressBar: React.FC<{
  activeStage: number;          // 0-indexed. -1 = none yet.
  revealStartFrame?: number;    // when set, stages stagger in
}> = ({ activeStage, revealStartFrame }) => {
  const frame = useCurrentFrame();
  const pulse = 0.78 + 0.22 * Math.sin(frame * 0.12);

  const containerOpacity =
    revealStartFrame === undefined
      ? 1
      : interpolate(frame, [revealStartFrame - 6, revealStartFrame + 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT,
        });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 36,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "20px 38px",
          background: "rgba(248, 241, 227, 0.86)",
          border: `1.5px solid ${COLORS.line}`,
          borderRadius: 999,
          boxShadow: "0 10px 36px rgba(15,23,42,0.14)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        {STAGES.map((stage, i) => {
          const state: "done" | "active" | "upcoming" =
            i < activeStage ? "done" : i === activeStage ? "active" : "upcoming";

          const color =
            state === "active"
              ? COLORS.violet
              : state === "done"
                ? COLORS.greenDeep
                : COLORS.ink3;

          let entry = 1;
          let entryRise = 0;
          if (revealStartFrame !== undefined) {
            const start = revealStartFrame + i * STAGGER;
            entry = interpolate(frame, [start, start + ENTRY_DUR], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE_OUT,
            });
            entryRise = (1 - entry) * 10;
          }

          const stateOpacity =
            state === "active" ? pulse : state === "done" ? 0.92 : 0.42;
          const opacity = entry * stateOpacity;
          const weight = state === "active" ? 800 : state === "done" ? 700 : 600;

          return (
            <React.Fragment key={stage}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity,
                  transform: `translateY(${entryRise}px)`,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      state === "done"
                        ? COLORS.green
                        : state === "active"
                          ? COLORS.violet
                          : "transparent",
                    border:
                      state === "upcoming"
                        ? `2px solid ${COLORS.ink3}55`
                        : `2px solid transparent`,
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 900,
                    lineHeight: 1,
                    boxShadow:
                      state === "active"
                        ? `0 0 18px ${COLORS.violet}99`
                        : "none",
                  }}
                >
                  {state === "done" ? "✓" : ""}
                </span>
                <span
                  style={{
                    fontFamily: FONT_STACK,
                    fontSize: 24,
                    fontWeight: weight,
                    color,
                    letterSpacing: "0.03em",
                    textShadow:
                      state === "active" ? `0 0 16px ${color}55` : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {stage}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <span
                  style={{
                    color: COLORS.ink3,
                    opacity: 0.45 * entry,
                    fontSize: 22,
                    lineHeight: 1,
                  }}
                >
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
