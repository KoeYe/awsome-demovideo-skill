import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLORS, FONT_STACK, TITLE_FONT_STACK } from "../theme";
import { Reveal } from "../components/Reveal";
import { EASE_OUT } from "../components/Easing";

// 4-second opening title. Demonstrates the full scene pattern:
//   1. zod schema → Remotion Studio props panel
//   2. exported DEFAULTS constant for the main timeline
//   3. component itself

// ────────────────────────────────────────────────────────────────
// Schema — shows up as sliders in Remotion Studio.
export const openingTitleSchema = z.object({
  title:        z.string(),
  subtitle:     z.string(),
  highlight:    z.string(),    // substring of subtitle to highlight in violet
  titleSize:    z.number().min(40).max(280),
  subtitleSize: z.number().min(14).max(80),
});
export type OpeningTitleProps = z.infer<typeof openingTitleSchema>;

// ────────────────────────────────────────────────────────────────
// Defaults — consumed by Main.tsx. KEEP IN SYNC with Root.tsx's
// inline defaultProps={} literal (see references/pitfalls.md #2).
export const OPENING_TITLE_DEFAULTS: OpeningTitleProps = {
  title:        "My Product",
  subtitle:     "Automatic Environment Generation for Embodied Training",
  highlight:    "Environment Generation",
  titleSize:    168,
  subtitleSize: 56,
};

// ────────────────────────────────────────────────────────────────

export const OpeningTitle: React.FC<OpeningTitleProps> = (p) => {
  const frame = useCurrentFrame();

  // Soft fade-in wash (replaces hard white flash).
  const wash = interpolate(frame, [0, 10], [0.35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  // Gradient sweeps across the title once as it lands.
  const gradPos = interpolate(frame, [14, 70], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  // Slow halo pulse on the highlighted phrase.
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin(((frame - 28) * Math.PI) / 60));

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
          textAlign: "center",
        }}
      >
        {/* Title — gradient sweep + drop shadow */}
        <Reveal delay={4} duration={22} rise={14}>
          <div
            style={{
              fontFamily: TITLE_FONT_STACK,
              fontSize: p.titleSize,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              backgroundImage:
                "linear-gradient(120deg, #0F172A 0%, #1E293B 28%, #4338CA 55%, #7C3AED 75%, #EA580C 100%)",
              backgroundSize: "220% 100%",
              backgroundPosition: `${gradPos}% 50%`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 10px 28px rgba(15,23,42,0.16))",
            }}
          >
            {p.title}
          </div>
        </Reveal>

        {/* Subtitle with violet halo highlight */}
        <Reveal delay={28} duration={22} rise={12}>
          <SubtitleWithHighlight
            text={p.subtitle}
            highlight={p.highlight}
            fontSize={p.subtitleSize}
            pulse={pulse}
          />
        </Reveal>
      </div>

      {/* Soft initial wash — must render LAST so it sits on top. */}
      <AbsoluteFill
        style={{ background: "#FFFFFF", opacity: wash, pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
};

// ────────────────────────────────────────────────────────────────

const SubtitleWithHighlight: React.FC<{
  text: string;
  highlight: string;
  fontSize: number;
  pulse: number;
}> = ({ text, highlight, fontSize, pulse }) => {
  // Split text around the highlight phrase. If it's not found, render plain.
  const idx = text.indexOf(highlight);
  if (idx === -1) {
    return (
      <div style={baseSubtitleStyle(fontSize)}>{text}</div>
    );
  }
  const before = text.slice(0, idx);
  const after = text.slice(idx + highlight.length);
  return (
    <div style={baseSubtitleStyle(fontSize)}>
      {before}
      <span
        style={{
          color: COLORS.violet,
          fontWeight: 800,
          textShadow: `0 0 ${12 + pulse * 22}px rgba(124,58,237,${0.35 + pulse * 0.25})`,
        }}
      >
        {highlight}
      </span>
      {after}
    </div>
  );
};

const baseSubtitleStyle = (fontSize: number): React.CSSProperties => ({
  fontFamily: FONT_STACK,
  fontSize,
  fontWeight: 500,
  color: COLORS.ink2,
  lineHeight: 1.4,
  whiteSpace: "nowrap",
});
