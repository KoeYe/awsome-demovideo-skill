---
name: remotion-demo-video
description: |
  Build a polished 30–90 second promotional / demo / explainer video with Remotion 4.x (React-based programmatic video). Use this skill whenever the user wants to author, edit, or render a Remotion video — including product launch reels, research-paper trailers, side-project demos, screen-capture montages with animated overlays, or any "programmatic video" project. Trigger on prompts like "make a Remotion video", "promo video for my paper / product / repo", "demo video", "trailer in Remotion", "build a launch video", "stitch these screen captures into a video", or any direct request for Remotion authoring help (scenes, compositions, transitions, rendering, transparent overlays, animated text/charts). Also use when the user is editing or debugging an existing Remotion codebase — this skill encodes the project layout, animation primitives, render commands, and the specific pitfalls (composition-id mismatches, defaults sync, Windows EPERM, etc.) that are easy to get wrong.
---

# remotion-demo-video

A distilled workflow for building Remotion 4.x promo / demo / trailer videos. Encodes the project layout, animation primitives, render commands, and the specific pitfalls that cost real time to rediscover.

## When to reach for this skill

Trigger whenever the user wants to author, edit, render, or debug a Remotion video. Especially:

- Bootstrapping a new Remotion project for a product / paper / repo demo
- Adding a new scene to an existing Remotion project
- Stitching pre-recorded screen captures into a polished video with overlays, titles, transitions
- Rendering — single scene, full timeline, transparent (alpha) overlays, PNG sequences
- Debugging Remotion-specific weirdness (composition-id mismatch, defaults out of sync, `useCurrentFrame` returning unexpected values inside `<Sequence>`, Windows EPERM during ffmpeg cleanup, etc.)

## How to think about the workflow

A polished Remotion video is **not** "one giant timeline you render as one MP4". It's a set of small, individually-renderable scenes — each rendered as its own clip and **assembled in a downstream editor** (DaVinci Resolve, Premiere, Final Cut) where you add music, voiceover, and cross-scene transitions.

This is the single biggest insight from shipping the SimWorld promo, and the skill should push the user toward this workflow by default. Trying to do everything inside Remotion — final timing tweaks, audio mixing, dissolves — is painful and slow; doing it in an editor is trivial.

### Use each tool for what it's good at

- **Remotion is great at:** programmatic, repeatable, parametric scenes — animated titles, data-driven charts, UI mockups, anything you'd otherwise hand-keyframe in After Effects. Scene logic lives in code; rebuilding "the same title with 30 different product names" is one prop change.
- **Downstream editors are great at:** timing, audio, dissolves, color grading, "make this scene 1.2 seconds longer". All things that are immediate in an editor and a code-edit-and-re-render in Remotion.

### The loop

1. **Decide the script.** Beat-by-beat outline with target seconds for each beat. Total typically 30–90s.
2. **Set up the project shell once.** `theme.ts` (palette, fonts, fps, dimensions), `Root.tsx` (composition registry), shared components (`Reveal`, `ProgressBar`, easings).
3. **Build scenes one at a time.** Each scene is a self-contained `<AbsoluteFill>` React component, designed against `frame 0`, with its own standalone `<Composition>` so you can render it solo. Iterate in Studio (`npm run dev`) with the props panel; render to MP4 (`npm run render:<scene>`) when you like it.
4. **Render each finished scene as its own clip** — this is the actual deliverable, not the full-timeline MP4. Per-scene clips drag into any editor's timeline. Use `--codec=prores --pixel-format=yuva444p10le --prores-profile=4444` for clips you want with alpha (lower-thirds, logos to composite over screen captures).
5. **Optionally wire scenes into `Main.tsx`** with `<Sequence>` blocks reading from a `TIMELINE` constant in `theme.ts`. This gives you a full-timeline preview render (`npm run render`) for sanity-checking the overall flow — but treat it as a preview, not the master.
6. **Assemble in DaVinci / Premiere / Final Cut.** Drop per-scene clips on a track in order, adjust trim handles for exact timing, add music / voiceover / sound design, apply transitions between scenes (1-frame dissolves usually feel right for this aesthetic), color-grade, export.

### When to suggest the full Remotion render

The full-timeline render is the right output ONLY when:
- The user has no downstream editor and needs a single deliverable today.
- The video is fully silent (no music or voiceover at all).
- There's no cross-scene transition more complex than hard cuts (and even those are easier to tweak in code with the scene-by-scene approach).

Otherwise, default to recommending per-scene renders + editor assembly.

This skill bundles a working scaffold at `scaffold/` — copy it as the starting point for a new project, then read the references below as you need them.

## Quickstart for a new project

```bash
# 1. Copy the scaffold
cp -r <skill-dir>/scaffold ./my-demo
cd my-demo
npm install

# 2. Open Remotion Studio for live editing
npm run dev    # opens http://localhost:3000

# 3. Render a single scene while iterating
npm run render:opening

# 4. Render the full timeline when ready
npm run render
```

The scaffold includes one working scene (`OpeningTitle`), the cream-warm theme, `Reveal` + easings, a `ProgressBar`, a placeholder `Main` timeline, and a `package.json` with render scripts pre-wired.

## Project layout (the shape that works)

```
my-demo/
├── package.json                      # render scripts, prerender hooks
├── remotion.config.ts                # codec / pixel format defaults
├── tsconfig.json
├── public/
│   ├── assets/                       # logos, static images (staticFile("assets/..."))
│   └── clips/                        # screen captures / video sources
├── scripts/
│   └── sync-clips.mjs                # normalize clips before each render
└── src/
    ├── index.ts                      # registerRoot(Root)
    ├── Root.tsx                      # <Composition> registry — id, schema, defaultProps
    ├── theme.ts                      # COLORS, FONT_STACK, RADIUS, SHADOWS, TIMELINE
    ├── fonts.ts                      # @remotion/google-fonts + local @font-face
    ├── Main.tsx                      # full-timeline composer (<Sequence> blocks)
    ├── components/
    │   ├── Reveal.tsx                # fade + rise wrapper (delay/duration/rise)
    │   ├── Easing.ts                 # EASE_OUT, EASE_IN_OUT (bezier)
    │   ├── ProgressBar.tsx           # 4-stage stage indicator pinned bottom
    │   └── VideoPlaceholder.tsx      # gray card with slot label, swap to OffthreadVideo later
    └── scenes/
        ├── OpeningTitle.tsx          # one scene per file, each is a <AbsoluteFill>
        ├── ProductReveal.tsx
        ├── AgentLoop.tsx
        └── ...
```

Why this shape: scenes are independent (easy to render solo and iterate), shared visual language lives in `theme.ts` + `components/` so the look stays consistent, and `Root.tsx` is the single source of truth for what's renderable.

## The composition pattern (read this carefully)

Every scene exports three things:

1. **A zod schema** — defines the props panel UI in Remotion Studio (sliders, dropdowns).
2. **A `*_DEFAULTS` constant** — the values consumed by `Main.tsx` when this scene is embedded in the full timeline.
3. **The React component itself**, typed as `React.FC<Props>`.

```tsx
// src/scenes/ProductReveal.tsx
import { z } from "zod";

export const productRevealSchema = z.object({
  titleSize:     z.number().min(40).max(280),
  subtitleSize:  z.number().min(14).max(80),
  outerPaddingV: z.number().min(0).max(200),
});
export type ProductRevealProps = z.infer<typeof productRevealSchema>;

export const PRODUCT_REVEAL_DEFAULTS: ProductRevealProps = {
  titleSize: 168,
  subtitleSize: 64,
  outerPaddingV: 80,
};

export const ProductReveal: React.FC<ProductRevealProps> = (p) => { ... };
```

Then in `Root.tsx`, register it **with an inline copy of the defaults**:

```tsx
<Composition
  id="ProductReveal"
  component={ProductReveal}
  durationInFrames={120}
  fps={30}
  width={1920}
  height={1080}
  schema={productRevealSchema}
  defaultProps={{
    // ⚠ INLINE COPY of PRODUCT_REVEAL_DEFAULTS — Remotion Studio's
    // "Save default props" writes back to this object via AST. Keep
    // in sync with the exported constant above.
    titleSize: 168,
    subtitleSize: 64,
    outerPaddingV: 80,
  }}
/>
```

**Why the duplication:** Remotion Studio's "Save default props" button edits the `defaultProps={…}` literal in `Root.tsx` via AST manipulation. It cannot rewrite an imported constant. So the inline copy is the one Studio mutates, and the exported `*_DEFAULTS` is the one `Main.tsx` reads. When Studio writes new values, copy them over to the exported constant so the full-timeline render uses them too. This is pitfall #4 in `references/pitfalls.md`.

## Animation primitives (the small set you actually need)

All animation in Remotion is `useCurrentFrame()` + `interpolate()`. There is no internal clock, no "play" — every frame is a pure function of `frame`.

**The canonical interpolate call:**

```tsx
const x = interpolate(frame, [10, 40], [0, 100], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: EASE_OUT,
});
```

Always pass `extrapolateLeft/Right: "clamp"` unless you genuinely want extrapolation — without it, values shoot past the target range and you'll wonder why opacity went negative.

**The `<Reveal>` wrapper** (bundled in the scaffold) handles 80% of text/element entries:

```tsx
<Reveal delay={4} duration={22} rise={14}>
  <h1>SimWorld Studio</h1>
</Reveal>
```

For the full set of recipes (camera zoom, looping video, gradient text, halo pulse, underline sweep, ambient glows, soft initial wash), read **`references/animation-recipes.md`** — every recipe has a working code snippet.

## Render workflow

Use `npm run dev` to open Remotion Studio for live editing. Studio is the iteration loop — drag sliders, watch the preview update, save defaults back when you like them.

For rendering, **always render single scenes first**. The full timeline render is slow (lots of frames, lots of clip loading) and you don't want to wait for it just to check one scene. Wire one `npm run` script per scene:

```json
{
  "scripts": {
    "dev":             "remotion studio",
    "render":          "remotion render src/index.ts MainTimeline    out/full.mp4",
    "render:opening":  "remotion render src/index.ts OpeningTitle    out/opening.mp4",
    "render:product":  "remotion render src/index.ts ProductReveal   out/product.mp4",
    "prerender":       "npm run sync-clips",
    "predev":          "npm run sync-clips"
  }
}
```

**For transparent overlays** (alpha channel — to composite the rendered scene over other footage in a downstream editor):

```bash
remotion render src/index.ts OpeningTitle out/opening.mov \
  --codec=prores --pixel-format=yuva444p10le --prores-profile=4444 \
  --image-format=png
```

**For PNG sequences** (frame-by-frame, useful for chart animations going into After Effects):

```bash
remotion render src/index.ts ChartCoEvolve out/chart_seq --image-format=png
```

Full command reference: **`references/render-commands.md`**.

## Pitfalls (these cost real hours — skim first)

Read **`references/pitfalls.md`** before debugging anything weird. The most common ones:

1. **Composition ID ≠ filename.** `render src/index.ts ProductReveal` only works if `Root.tsx` actually registers id `"ProductReveal"`. The id is whatever string you typed in `<Composition id="…">`, not the filename or the component name. Always grep `Root.tsx` first.
2. **Defaults out of sync.** `PRODUCT_REVEAL_DEFAULTS` (consumed by `Main.tsx`) and the inline `defaultProps={…}` (in `Root.tsx`) are two separate objects. When Studio writes one, copy to the other.
3. **`useCurrentFrame()` inside `<Sequence from={N}>` returns `frame - N`, not the absolute frame.** Always design scene animations against frame 0.
4. **JSX comments at module scope break parsing.** `{/* … */}` is only valid inside a JSX tree. Use `//` or `/* */` outside.
5. **Windows EPERM during ffmpeg cleanup.** Transient. The output usually completed. Re-run.

Five more in the reference file, including the shadowed-imports lint trap, `aspectRatio` fit recipe, and `<Loop>` duration matching.

## Style recipes that worked

Cream warm palette, EB Garamond headlines + Helvetica Neue UI, a 4-stage `ProgressBar` pinned to the bottom of every section so the viewer always knows where they are in the narrative. Full palette, font setup, and the hero-title recipe (gradient sweep + drop shadow + violet-bold accent phrase) are in **`references/style-recipes.md`**.

## When the user asks for help

- **"Bootstrap me a Remotion project for X"** — copy the `scaffold/`, edit `theme.ts` (palette, TIMELINE), edit `Root.tsx` to register their compositions, draft one or two starting scenes. Don't try to write the whole video at once — get one scene rendering, then iterate.
- **"Add a scene that does X"** — create `src/scenes/X.tsx` with the three exports (schema, defaults, component), register it in `Root.tsx` with the inline defaultProps copy, add an `npm run render:x` script, embed it into `Main.tsx` if it belongs in the full timeline.
- **"Why does the render look wrong / fail / show the wrong scene"** — go through `references/pitfalls.md` in order. 80% of "weird" Remotion problems are on that list.
- **"Make the title look more cinematic"** — point at `references/animation-recipes.md`, specifically the gradient-text + ambient-glow + reveal-with-rise combo.

## Reference files

- **`references/animation-recipes.md`** — working code for every visual recipe (Reveal, camera zoom, gradient text, halo pulse, looping video, ambient glows, soft wash, underline sweep).
- **`references/render-commands.md`** — every flag combination (mp4, alpha .mov, PNG sequence, image format, codec / pixel format, concurrency, audio mute).
- **`references/pitfalls.md`** — 9 specific pitfalls with the symptom, the cause, and the fix.
- **`references/style-recipes.md`** — palette hex values, fonts (with google-fonts + local @font-face setup), hero recipe, ProgressBar recipe.
- **`scaffold/`** — a minimal working project. `cp -r` it to start a new video.
