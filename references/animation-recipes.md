# Animation Recipes

Every recipe here is a self-contained snippet — drop it into a scene component and it works. All assume:

```tsx
import { useCurrentFrame, interpolate } from "remotion";
import { EASE_OUT } from "../components/Easing";
```

## Table of contents

- [The canonical `interpolate` call](#canonical)
- [`<Reveal>` — fade + slide-in](#reveal)
- [Gradient sweep text](#gradient-text)
- [Soft halo / pulse on a word](#halo)
- [Underline sweep](#underline-sweep)
- [Camera zoom (transform-origin + scale)](#camera-zoom)
- [Looping background video](#loop-video)
- [Ambient drifting glows](#ambient-glows)
- [Soft initial wash (replaces hard white flash)](#soft-wash)
- [Step-function reveals (typewriter, counter, etc.)](#step-fn)
- [Sequencing within a scene](#within-scene)

---

<a id="canonical"></a>
## The canonical `interpolate` call

```tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [10, 40], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: EASE_OUT,
});
```

**Always clamp** unless you genuinely want extrapolation. Without clamping, the value flies past the target range (opacity goes negative, scale explodes). 95% of "why is my animation glitching" bugs are missing clamp.

**Easing choice:**
- `EASE_OUT` — most things. Confident, decisive landing.
- `EASE_IN_OUT` — camera moves, anything starting and ending at rest.
- Linear (no `easing`) — gradient-position sweeps, looping rotations.

---

<a id="reveal"></a>
## `<Reveal>` — fade + slide-in

The scaffold ships this. It's the single most-used wrapper in the SimWorld promo.

```tsx
// components/Reveal.tsx
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT } from "./Easing";

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
    <div style={{
      opacity: enter * exit,
      transform: `translateY(${(1 - enter) * rise}px)`,
      ...style,
    }}>
      {children}
    </div>
  );
};
```

Use it:

```tsx
<Reveal delay={4}  duration={22} rise={14}><Title /></Reveal>
<Reveal delay={28} duration={22} rise={12}><Subtitle /></Reveal>
<Reveal delay={58} duration={22} rise={10} out={{ at: 120, duration: 12 }}>
  <Logo />
</Reveal>
```

Staggering by ~24 frames between stacked reveals reads as a deliberate, cinematic landing.

---

<a id="gradient-text"></a>
## Gradient sweep text

Big headline letters fill with a moving gradient. The look that anchors the SimWorld opening.

```tsx
const frame = useCurrentFrame();
const gradPos = interpolate(frame, [14, 70], [0, 100], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: EASE_OUT,
});

<div
  style={{
    fontFamily: TITLE_FONT_STACK,
    fontSize: 168,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 0.95,
    // 220% background — wider than the text — so the gradient SWEEPS
    // across as backgroundPosition animates from 0% to 100%.
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
  SimWorld Studio
</div>
```

The three pieces that make this work:
1. `backgroundSize: 220% 100%` — wider than the element so there's room to slide.
2. `WebkitBackgroundClip: "text"` + `WebkitTextFillColor: "transparent"` — clip the gradient to the letter shapes.
3. Animated `backgroundPosition` — what makes it sweep.

`drop-shadow` (not `box-shadow`) follows the letter outlines, giving real text glow.

---

<a id="halo"></a>
## Soft halo / pulse on a word

Sin-based pulse on `textShadow`. The pulse is purely a function of `frame`, so it loops forever without state.

```tsx
const frame = useCurrentFrame();
const pulse = 0.55 + 0.45 * Math.abs(Math.sin(((frame - 28) * Math.PI) / 60));
// Period: 2 * 60 / 30fps = 4 seconds.

<span
  style={{
    color: "#7C3AED",
    fontWeight: 800,
    textShadow: `0 0 ${12 + pulse * 22}px rgba(124,58,237,${0.35 + pulse * 0.25})`,
  }}
>
  Environment Generation
</span>
```

Subtract a phase offset (`frame - 28`) to align the pulse start with the word's `Reveal` delay — feels like the halo only starts after the word lands.

---

<a id="underline-sweep"></a>
## Underline sweep

Absolute-positioned span under the text, animated with `transform: scaleX()`.

```tsx
const barProgress = interpolate(frame, [40, 80], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: EASE_OUT,
});

<span style={{ position: "relative", display: "inline-block" }}>
  <span>Environment Generation</span>
  <span
    style={{
      position: "absolute",
      left: 0, bottom: -6,
      height: 4, width: "100%",
      borderRadius: 999,
      background: "linear-gradient(90deg, rgba(124,58,237,0) 0%, #7C3AED 50%, rgba(124,58,237,0) 100%)",
      transform: `scaleX(${barProgress})`,
      transformOrigin: "0% 50%",
      opacity: 0.85,
    }}
  />
</span>
```

Gradient on the bar (transparent → solid → transparent) gives soft ends instead of a hard line. `transformOrigin: 0% 50%` makes it grow from the left; flip to `100% 50%` for right-to-left.

---

<a id="camera-zoom"></a>
## Camera zoom (transform-origin + scale)

The whole "zoom out from one cell → 2×2 grid → zoom in to another cell" transition is two `transform-origin + scale` animations on a single wrapper. No external library.

**Math:** the grid fills the canvas at `scale: 1`. To make ONE corner cell fill the canvas, scale 4× around that cell's centre (its distance from the canvas corner is 25%, 25%, so 4× makes it span 100%).

```tsx
const PHASE_A_END = 25;   // zoom-out lands here
const PHASE_B_END = 55;   // grid held until here
const PHASE_C_END = 90;   // zoom-in completes
const ZOOM_SCALE = 4;

const frame = useCurrentFrame();
const phaseA = interpolate(frame, [0, PHASE_A_END], [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT });
const phaseC = interpolate(frame, [PHASE_B_END, PHASE_C_END], [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT });

let scale: number, origin: string;
if (frame < PHASE_A_END) {
  scale = ZOOM_SCALE - phaseA * (ZOOM_SCALE - 1);  // 4 → 1
  origin = "25% 25%";                               // top-left cell
} else if (frame >= PHASE_B_END) {
  scale = 1 + phaseC * (ZOOM_SCALE - 1);            // 1 → 4
  origin = "75% 75%";                               // bottom-right cell
} else {
  scale = 1;
  origin = "50% 50%";
}

<div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${scale})` }}>
  {/* the grid lives here */}
</div>
```

Same wrapper, same children — only the pivot and scale change. Three other cells slide off-canvas naturally because they're far from the pivot.

---

<a id="loop-video"></a>
## Looping background video

```tsx
import { Loop, OffthreadVideo, staticFile } from "remotion";

<Loop durationInFrames={SCENE_DURATION}>
  <OffthreadVideo
    src={staticFile("clips/agent-loop.mp4")}
    muted
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }}
  />
</Loop>
```

Use **`OffthreadVideo`** (not `<Video>`) for renders — it decodes off-thread and is much faster. `<Video>` is for Studio playback fallback only.

**Always pass `muted`** unless you want the clip's audio in the render. Unmuted clips collide with your music track and sound terrible.

`Loop`'s `durationInFrames` should match the scene's total length so the clip restarts cleanly at the boundary — otherwise it stutters mid-scene.

**Playback rate:** pass `playbackRate={1.8}` on `<OffthreadVideo>` to speed up a clip without re-encoding. Useful when your source recording is 18s and you only have 10s in the timeline.

---

<a id="ambient-glows"></a>
## Ambient drifting glows

Two layered radial gradients that drift in opposite directions. Makes a static hero "breathe".

```tsx
const drift = (frame / 120) * Math.PI;
const glowX = 38 + Math.sin(drift) * 6;
const glowY = 32 + Math.cos(drift) * 5;

<AbsoluteFill style={{ pointerEvents: "none" }}>
  <div style={{
    position: "absolute", inset: 0,
    background: `radial-gradient(52% 42% at ${glowX}% ${glowY}%, rgba(124,58,237,0.22), transparent 70%)`,
  }} />
  <div style={{
    position: "absolute", inset: 0,
    background: `radial-gradient(50% 40% at ${100 - glowX}% ${100 - glowY}%, rgba(234,88,12,0.18), transparent 70%)`,
  }} />
</AbsoluteFill>
```

**These can read as noisy** on a clean cream background — sometimes the user will ask to remove them and use a pure color. Treat as optional polish, not default.

---

<a id="soft-wash"></a>
## Soft initial wash (replaces hard white flash)

Old promo-video instinct: open with a hard white flash. Better: a SOFT wash that fades in. Eyes adjust gracefully.

```tsx
const wash = interpolate(frame, [0, 10], [0.35, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: EASE_OUT,
});

// Render LAST (on top of everything):
<AbsoluteFill style={{ background: "#FFFFFF", opacity: wash, pointerEvents: "none" }} />
```

Drop `0.35` to `0.6` if you want it more pronounced, or to `0.2` for barely-there.

---

<a id="step-fn"></a>
## Step-function reveals (typewriter, counter, etc.)

For "tick up a counter" or "type out a string", don't try to interpolate — use a step function indexed by frame.

```tsx
// Discrete reward counter
const REWARD_STEPS: [number, number][] = [
  [0.000,  0.05],
  [0.083,  0.18],
  [0.156,  0.32],
  [0.220, -0.30],
  [0.417,  0.00],
];

function discreteReward(t: number): number {
  let v = REWARD_STEPS[0][1];
  for (const [th, val] of REWARD_STEPS) if (t >= th) v = val;
  return v;
}

const t = frame / TOTAL;
const reward = discreteReward(t);
```

For a typewriter: `text.slice(0, Math.floor(t * text.length))`.

---

<a id="within-scene"></a>
## Sequencing within a scene

Inside a scene, sequencing is just `delay` props on `<Reveal>`. You don't need `<Sequence>` for that.

`<Sequence>` is for stitching SCENES together in `Main.tsx`:

```tsx
import { Sequence } from "remotion";
import { TIMELINE } from "./theme";

<Sequence from={TIMELINE.opening.start}  durationInFrames={TIMELINE.opening.dur}>
  <OpeningTitle />
</Sequence>
<Sequence from={TIMELINE.product.start}  durationInFrames={TIMELINE.product.dur}>
  <ProductReveal {...PRODUCT_REVEAL_DEFAULTS} />
</Sequence>
```

**Gotcha:** `useCurrentFrame()` inside the scene returns `frame - from`, NOT the absolute timeline frame. Always design scenes against frame 0; the `<Sequence from>` handles where it lands in the main timeline. (See `pitfalls.md` #3.)
