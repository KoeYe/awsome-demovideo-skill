// Visual theme — cream warm palette, EB Garamond + Helvetica Neue fonts,
// 4-stage TIMELINE for the main composer.

export const FONT_STACK =
  "'Helvetica Neue', Helvetica, Arial, sans-serif";

export const TITLE_FONT_STACK =
  "'EB Garamond', Georgia, 'Times New Roman', serif";

export const FONT_MONO =
  "'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace";

export const COLORS = {
  // Surfaces
  bg:       "#EFE5D2",
  bgAlt:    "#F8F1E3",
  bgTint:   "#F4EBD6",
  bgDeep:   "#0B1220",
  panel:    "#F8F1E3",

  // Ink
  ink:      "#0F172A",
  ink2:     "#334155",
  ink3:     "#64748B",

  // Lines
  line:     "#E6E9EF",
  line2:    "#EEF0F4",

  // Accents
  blue:        "#2563EB",
  blueDeep:    "#1D4ED8",
  blueSoft:    "#EFF4FF",
  blueBorder:  "#DBE6FF",

  green:       "#16A34A",
  greenDeep:   "#14532D",
  greenSoft:   "#ECFDF5",
  greenBorder: "#C7EBD6",

  violet:      "#7C3AED",
  violetDeep:  "#5B21B6",
  violetSoft:  "#F3EFFF",
  violetBorder:"#DDD0FF",

  orange:      "#EA580C",
  orangeDeep:  "#C2410C",
  orangeSoft:  "#FFF1E6",
  orangeBorder:"#FED7AA",

  red:         "#DC2626",
  redSoft:     "#FEF2F2",
  redBorder:   "#FECACA",
} as const;

export const SHADOWS = {
  card: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)",
  pop:  "0 6px 18px rgba(15,23,42,0.10)",
} as const;

export const RADIUS = {
  card: 14,
  panel: 12,
  button: 10,
  pill: 999,
  badge: 999,
} as const;

export const FPS = 30;
export const VIDEO_W = 1920;
export const VIDEO_H = 1080;

// Main timeline — edit to match your video's beats. Durations are in frames @ 30fps.
//
//  0  – 4 s   Opening title
//  4  – 12 s  Scene B
//  12 – 20 s  Scene C
//  …
export const TIMELINE = {
  opening: { start:   0, dur: 120 }, // 0–4s
  // Add more entries as you build out the timeline.
} as const;

export const TOTAL_FRAMES = 120; // Sum of all TIMELINE.dur values
