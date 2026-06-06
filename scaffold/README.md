# my-demo-video

Promo / demo video built with [Remotion](https://www.remotion.dev/) 4.x. Scaffolded by the `remotion-demo-video` skill.

## Quickstart

```bash
npm install
npm run dev        # opens Remotion Studio at http://localhost:3000
```

In Studio you can scrub through scenes, adjust props via the right-hand panel, and click "Save default props" to write your tweaks back to `Root.tsx`.

## The clip workflow — read ASSETS.md

When Claude scaffolds scenes for you, it leaves `<VideoPlaceholder slot="...">` markers where your recorded footage will go, and writes the full clip list to [`ASSETS.md`](./ASSETS.md). Your loop:

1. Open `ASSETS.md` — it lists every clip needed (slot name, scene, duration, aspect, what to capture).
2. Record each clip and save as `public/clips/<slot>.mp4` — filename must match the slot name exactly.
3. Ask Claude to swap the placeholders for `<OffthreadVideo>` (one-line change per slot), or do it yourself.
4. `npm run render:<scene>` and check the result.

## Rendering — the workflow that actually works

**Render each scene as its own clip. Assemble + score in a downstream editor** (DaVinci Resolve, Premiere, Final Cut). The full-timeline MP4 is for preview, not for delivery.

Why: tweaking a scene's length in an editor is dragging an edge. Doing the same in Remotion code means editing `TIMELINE`, re-rendering the whole timeline, watching it again. Music, voiceover, cross-scene dissolves — all trivial in an editor, painful in code.

```bash
npm run render:opening          # → out/opening.mp4   (primary — one clip per scene)
# add more npm run render:<scene> scripts as you build more scenes,
# then drop the per-scene MP4s into DaVinci / Premiere / Final Cut.

npm run render                  # → out/full.mp4      (preview / fallback only)
```

For transparent overlays (alpha channel — lower-thirds and animated logos to composite over screen captures in your editor):

```bash
npm run render:opening:transparent    # → out/opening.mov (ProRes 4444 + alpha)
```

## Project layout

```
src/
  index.ts          # entry — registerRoot(Root)
  Root.tsx          # composition registry — id, schema, defaultProps
  Main.tsx          # full timeline (<Sequence> blocks for each scene)
  theme.ts          # COLORS, FONTS, RADIUS, SHADOWS, TIMELINE
  fonts.ts          # font loading (google-fonts + optional local @font-face)
  components/
    Reveal.tsx              # fade + rise wrapper
    Easing.ts               # EASE_OUT, EASE_IN_OUT
    ProgressBar.tsx         # 4-stage indicator pinned bottom
    VideoPlaceholder.tsx    # gray card for slots, swap to OffthreadVideo later
  scenes/
    OpeningTitle.tsx        # example scene — copy-paste to make more
public/
  assets/           # logos, static images   → staticFile("assets/...")
  clips/            # video clips             → staticFile("clips/...")
scripts/
  sync-clips.mjs    # pre-render hook to copy clips from source dirs
```

## Adding a new scene

1. Create `src/scenes/<Name>.tsx` exporting `schema`, `<NAME>_DEFAULTS`, and the component.
2. Register it in `src/Root.tsx` with an INLINE copy of the defaults (Remotion Studio's "Save default props" writes back via AST and can only mutate inline literals).
3. Add a render script to `package.json` for fast solo iteration.
4. Add to `src/Main.tsx` (and `TIMELINE` in `theme.ts`) when ready to assemble.

## Pitfalls to know

Read `references/pitfalls.md` in the parent skill folder — the most common ones:

- Composition id ≠ filename. The CLI takes the `id="..."` on `<Composition>`. Always grep `Root.tsx` first.
- `useCurrentFrame()` inside `<Sequence from={N}>` returns `frame - N`, not the absolute frame. Design scenes against frame 0.
- Defaults must be synced between the exported constant and the inline literal in `Root.tsx`.
- On Windows, `EPERM` errors during ffmpeg cleanup are transient — output usually completed. Retry.
