# Style Recipes

The visual decisions that made the SimWorld promo cohere. Use as defaults; deviate intentionally.

## Table of contents

- [Palette: cream warm](#palette)
- [Fonts: serif headlines + sans UI + mono code](#fonts)
- [Hero title recipe](#hero)
- [Subtitle with highlight phrase](#subtitle)
- [`ProgressBar` recipe (4-stage stage indicator)](#progressbar)
- [Card / panel recipe](#cards)
- [Soft chip badges](#chips)
- [Spacing and rhythm](#spacing)

---

<a id="palette"></a>
## Palette: cream warm

Sets the tone — warm, considered, "not another dark-mode VC tech video". The cream background is the foundation; everything else is calibrated to sit nicely on it.

```ts
export const COLORS = {
  // Surfaces — warm cream
  bg:       "#EFE5D2",   // page background
  bgAlt:    "#F8F1E3",   // pill / chip background — lighter cream
  bgTint:   "#F4EBD6",   // subtle tint, between bg and bgAlt
  bgDeep:   "#0B1220",   // dark surfaces (HUD viewports)
  panel:    "#F8F1E3",   // card / panel background

  // Ink (text)
  ink:      "#0F172A",
  ink2:     "#334155",
  ink3:     "#64748B",

  // Lines
  line:     "#E6E9EF",
  line2:    "#EEF0F4",

  // Accents — each comes with deep / soft / border variants
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
```

**Brand accent:** violet (`#7C3AED`) is the SimWorld brand accent — used for the main highlight phrase, the active ProgressBar stage, primary CTAs. Pick ONE color to play this role; using multiple "primary" colors looks unfocused.

**Status colors:** blue = neutral / observational, green = success / "done", orange = warning / attention, red = failure.

---

<a id="fonts"></a>
## Fonts: serif headlines + sans UI + mono code

```ts
export const TITLE_FONT_STACK =
  "'EB Garamond', Georgia, 'Times New Roman', serif";
export const FONT_STACK =
  "'Helvetica Neue', Helvetica, Arial, sans-serif";
export const FONT_MONO =
  "'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace";
```

Loaded via `fonts.ts` — see scaffold for the wiring:

```tsx
// src/fonts.ts
import { loadFont } from "@remotion/google-fonts/EBGaramond";
import { staticFile, continueRender, delayRender } from "remotion";

// Google font: handled by @remotion/google-fonts — call once.
loadFont();

// Local font: inject @font-face into the document.
const handle = delayRender();
const font = new FontFace(
  "Helvetica Neue",
  `url(${staticFile("fonts/HelveticaNeue.otf")}) format("opentype")`,
);
font.load().then(() => {
  document.fonts.add(font);
  continueRender(handle);
});
```

**Why serif for titles in a tech video?** EB Garamond reads as "considered, academic, not selling you anything". Pairs well with the warm cream background. Sans-serif headlines (Helvetica/Inter/Geist) are the default everyone uses — opting out makes the brand instantly distinguishable.

**Letter-spacing rules:**
- Display sizes (>100px): `letterSpacing: "-0.02em"` (tighter, more confident)
- Body / UI: `letterSpacing: 0` or `"-0.005em"`
- Small uppercase labels: `letterSpacing: "0.14em"` to `"0.20em"` (the wider, the more "label-y")

---

<a id="hero"></a>
## Hero title recipe

The opening title. Combines gradient text + soft drop shadow + a `Reveal` with rise.

```tsx
<Reveal delay={4} duration={22} rise={14}>
  <div
    style={{
      fontFamily: TITLE_FONT_STACK,
      fontSize: 168,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 0.95,
      backgroundImage:
        "linear-gradient(120deg, #0F172A 0%, #1E293B 28%, #4338CA 55%, #7C3AED 75%, #EA580C 100%)",
      backgroundSize: "220% 100%",
      backgroundPosition: `${gradPos}% 50%`,  // animated 0 → 100
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      filter: "drop-shadow(0 10px 28px rgba(15,23,42,0.16))",
    }}
  >
    SimWorld Studio
  </div>
</Reveal>
```

Numbers to remember:
- `fontSize: 168` reads as "the title" on 1920×1080. Scale down to ~120 for tighter layouts, up to ~240 for solo title cards.
- `fontWeight: 700` (not 800) — Garamond's 800 is too heavy; 700 still feels confident.
- `lineHeight: 0.95` — tightens vertical rhythm; default 1.2 is loose for display sizes.
- `letterSpacing: "-0.02em"` — display sizes need tracking pulled in.
- `drop-shadow(0 10px 28px rgba(15,23,42,0.16))` — follows letter outlines, subtle. `0.16` alpha is barely there; don't go higher.

See `animation-recipes.md#gradient-text` for the animated `gradPos`.

---

<a id="subtitle"></a>
## Subtitle with highlight phrase

One sentence, one word/phrase highlighted in the brand accent. Pulls the eye exactly where you want it.

```tsx
<div
  style={{
    fontFamily: FONT_STACK,
    fontSize: 64,
    fontWeight: 500,
    color: COLORS.ink2,
    lineHeight: 1.4,
    whiteSpace: "nowrap",
  }}
>
  Automatic{" "}
  <span
    style={{
      color: COLORS.violet,
      fontWeight: 800,
      textShadow: `0 0 ${12 + pulse * 22}px rgba(124,58,237,${0.35 + pulse * 0.25})`,
    }}
  >
    Environment Generation
  </span>{" "}
  for Embodied Training
</div>
```

Highlighted phrase: brand accent color + bumped weight (500 → 800) + soft pulsing halo. See `animation-recipes.md#halo` for the `pulse` calc.

**Optional:** under-the-phrase underline sweep (`animation-recipes.md#underline-sweep`). Adds motion but can read busy — remove if the halo alone is enough.

---

<a id="progressbar"></a>
## `ProgressBar` recipe (4-stage stage indicator)

Pinned bottom of every scene. The viewer always knows where they are in the narrative — "ah, we're in stage 2 of 4". For a 60s video with 4 acts, this orientation matters.

The scaffold includes this component. Key design choices:

- **4 stages, labeled.** Not just dots — actual short labels ("Environment Generation", "Verification", "Training", "Co-evolution"). Dots without labels are mystery progress.
- **Active stage: violet, pulsing.** Soft sine pulse on opacity.
- **Done stages: green with ✓.** "Behind me" — completed.
- **Upcoming: dim gray, no checkmark.** "Ahead of me".
- **`backdrop-filter: blur(10px)` on the pill background.** Lets the scene content show through softly.
- **Pinned `position: absolute; bottom: 36`** on the scene's outer `<AbsoluteFill>`. Reserve `~120px` of bottom padding in your scene layout so content doesn't overlap.

Pass `activeStage={N}` (0-indexed) from each scene. For the first scene, also pass `revealStartFrame={...}` to stagger the entry of the bar's pieces.

---

<a id="cards"></a>
## Card / panel recipe

For UI mockup panels (e.g., showing 4 screen-capture videos in a 2×2 grid):

```tsx
<div
  style={{
    background: COLORS.panel,
    border: `1px solid ${COLORS.line}`,
    borderRadius: RADIUS.card,         // 14
    boxShadow: SHADOWS.card,           // "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)"
    padding: 14,
    overflow: "hidden",
  }}
>
  <CardHeader />
  <CardBody />
</div>
```

Cream `panel` against cream `bg` — separated by the 1px line + the soft layered shadow. NOT a heavy drop shadow — the look is "page elements", not "floating cards".

---

<a id="chips"></a>
## Soft chip badges

Small status labels: "USER", "LIVE", "OBS", "HUD". Color-coded to status.

```tsx
const SOFT = {
  blue:   { bg: COLORS.blueSoft,   fg: COLORS.blue,   border: COLORS.blueBorder },
  green:  { bg: COLORS.greenSoft,  fg: COLORS.green,  border: COLORS.greenBorder },
  violet: { bg: COLORS.violetSoft, fg: COLORS.violet, border: COLORS.violetBorder },
  orange: { bg: COLORS.orangeSoft, fg: COLORS.orange, border: COLORS.orangeBorder },
  red:    { bg: COLORS.redSoft,    fg: COLORS.red,    border: COLORS.redBorder },
};

<span style={{
  fontFamily: FONT_STACK,
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  padding: "3px 10px",
  background: SOFT.violet.bg,
  border: `1px solid ${SOFT.violet.border}`,
  color: SOFT.violet.fg,
  borderRadius: 999,
}}>
  USER
</span>
```

Soft background + matching border + saturated text = label that reads as a status, not a primary CTA. Wide letter-spacing + uppercase = label, not a button.

---

<a id="spacing"></a>
## Spacing and rhythm

- **Outer padding on scenes:** `40px 60px 120px` (top, sides, bottom). Bottom is heavier to reserve space for `ProgressBar`.
- **Gap between major hero blocks:** 48–80px.
- **Gap between card-grid cells:** 18–22px.
- **Card padding (inner):** 14–20px.
- **Pill horizontal padding:** `10–22px` depending on content.

These are starting points — adjust to taste, but stay within these ranges and the design holds together.
