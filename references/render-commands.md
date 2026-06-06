# Render Commands

Every render is `remotion render <entry> <composition-id> <output>` with flags. Bundle commonly-used flag combinations as `npm` scripts so you don't have to type them.

## Recommended workflow (read first)

**Render scenes individually. Assemble + score in DaVinci / Premiere / Final Cut.** The full-timeline render is for preview, not delivery.

The reason: once a user has 4–6 scenes rendered as MP4s, dragging them onto an NLE timeline is faster and more flexible than every other approach. Tweaking a scene's length is dragging an edge; adding music is dropping a track; cross-scene dissolves are one click. Doing any of that inside Remotion means editing code, re-rendering the full timeline (minutes), and watching the result again.

So the typical render session looks like:

```bash
npm run render:opening      # render the scene you just finished
# … work on the next scene …
npm run render:product      # render that one
# … iterate until all scenes are done …
# → drop the per-scene MP4s into your editor of choice, arrange + score.
```

`npm run render` (full timeline) is for quick "is the overall flow okay" preview or as a backup deliverable when there's no editor in the loop. It is NOT the main artifact.

## Table of contents

- [Standard mp4](#mp4)
- [Transparent .mov (alpha channel)](#alpha)
- [PNG sequence](#png)
- [Single image (poster frame)](#poster)
- [Concurrency tuning](#concurrency)
- [Skipping audio](#audio)
- [Passing custom props at render time](#props)
- [Conventions for `package.json` scripts](#conventions)
- [Pre-render hooks (clip sync)](#hooks)

---

<a id="mp4"></a>
## Standard mp4

```bash
remotion render src/index.ts <CompositionId> out/<name>.mp4
```

Defaults: h264 codec, 30fps (or whatever the composition declares), source dimensions from `<Composition width/height>`.

Output size is dominated by visual complexity — a 4s static-text title is ~600 KB, a 16s screen-capture-driven scene is ~10 MB.

---

<a id="alpha"></a>
## Transparent .mov (alpha channel)

For overlays, lower-thirds, title cards that need to composite over other footage in a downstream editor (DaVinci, Premiere, Final Cut, After Effects):

```bash
remotion render src/index.ts <CompositionId> out/<name>.mov \
  --codec=prores \
  --pixel-format=yuva444p10le \
  --prores-profile=4444 \
  --image-format=png
```

Flag-by-flag:
- `--codec=prores` — Apple ProRes, the de facto standard for alpha video in pro NLEs.
- `--pixel-format=yuva444p10le` — the `a` is alpha. Without this you get opaque.
- `--prores-profile=4444` — the only ProRes variant that carries alpha. 422 variants don't.
- `--image-format=png` — Remotion renders frames as PNG before encoding (default is JPEG, which has no alpha). Required for transparent output.

File size: ProRes 4444 is roughly **10× larger** than h264 mp4. A 5-second 1920×1080 alpha clip is ~80 MB. Don't render the whole timeline this way — only the pieces you're overlaying.

---

<a id="png"></a>
## PNG sequence

For After Effects integration or any pipeline that wants frames:

```bash
remotion render src/index.ts <CompositionId> out/<name>_seq --image-format=png
```

Output is a folder of `element-000001.png`, `element-000002.png`, …

Sizes get big fast — 300 PNG frames at 1920×1080 is ~150 MB. Only use when the downstream pipeline genuinely needs it.

---

<a id="poster"></a>
## Single image (poster frame)

```bash
remotion still src/index.ts <CompositionId> out/poster.png --frame=60
```

`--frame=N` picks the frame (defaults to 0). Useful for thumbnails, social cards, README hero images.

---

<a id="concurrency"></a>
## Concurrency tuning

Remotion picks a default based on CPU cores. To override:

```bash
remotion render ... --concurrency=4
```

Set lower if the machine struggles (laptop overheating, OOM kills). Set higher if you have headroom and want faster renders — but past `cores - 2` you usually see diminishing returns from contention.

---

<a id="audio"></a>
## Skipping audio

If your scenes have no `<Audio>` tags and source clips are all `muted`, audio is skipped automatically. If you have audio and want to strip it:

```bash
remotion render ... --mute
```

Or render just audio:

```bash
remotion render ... out/audio.mp3
```

(Output extension drives format.)

---

<a id="props"></a>
## Passing custom props at render time

To override defaultProps without editing `Root.tsx`:

```bash
remotion render src/index.ts ProductReveal out/big-title.mp4 \
  --props='{"titleSize": 240}'
```

Single quotes on Linux/macOS; on Windows PowerShell escape inner quotes or use a `--props-file=props.json` instead. Useful for sweeps ("render the same title at 5 different sizes for A/B testing").

---

<a id="conventions"></a>
## Conventions for `package.json` scripts

One script per composition you'll commonly render. Group by output type.

```json
{
  "scripts": {
    "dev":     "remotion studio",
    "render":  "remotion render src/index.ts MainTimeline out/full.mp4",

    "render:opening":   "remotion render src/index.ts OpeningTitle  out/opening.mp4",
    "render:product":   "remotion render src/index.ts ProductReveal out/product.mp4",
    "render:end":       "remotion render src/index.ts EndCard       out/end.mp4",

    "render:opening:transparent": "remotion render src/index.ts OpeningTitle out/opening.mov --codec=prores --pixel-format=yuva444p10le --prores-profile=4444 --image-format=png",

    "render:chart:diversity:pngseq": "remotion render src/index.ts ChartDiversity out/charts/diversity_seq --image-format=png",

    "prerender": "npm run sync-clips",
    "predev":    "npm run sync-clips",
    "prebuild":  "npm run sync-clips"
  }
}
```

**Convention:** `render:foo` for normal mp4, `render:foo:transparent` for alpha, `render:foo:pngseq` for PNG sequence. Predictable so collaborators can find what they need.

---

<a id="hooks"></a>
## Pre-render hooks (clip sync)

If your scenes pull from `public/clips/*.mp4` and those clips come from elsewhere (a Google Drive folder, an `assets/` dir in a sibling repo, a Dropbox), normalize them before each render so the render uses the latest versions.

`scripts/sync-clips.mjs` (bundled in the scaffold) copies/symlinks the source clips into `public/clips/`. Wire it via npm `pre*` hooks:

```json
"predev":    "npm run sync-clips",
"prerender": "npm run sync-clips",
"prebuild":  "npm run sync-clips"
```

These run automatically before the matching script. You can't forget to sync.

For the SimWorld project we additionally had a `normalize-clips.mjs` that re-encoded clips to a consistent codec/fps/dimensions — Remotion handles mixed source formats but `OffthreadVideo` is faster with uniform sources.
