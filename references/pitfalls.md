# Pitfalls

These are real bugs from a real project. Each one cost minutes-to-hours to diagnose the first time. Skim before debugging anything weird.

## Table of contents

1. [Composition ID ≠ filename](#1)
2. [Defaults out of sync between scene file and `Root.tsx`](#2)
3. [`useCurrentFrame()` inside `<Sequence from>` returns relative frame](#3)
4. [JSX comments at module scope break parsing](#4)
5. [Shadowed imports compile silently](#5)
6. [Windows EPERM during ffmpeg cleanup](#6)
7. ["File modified between Read and Edit" when Studio is open](#7)
8. [`aspectRatio` + flex fit — the right CSS combo](#8)
9. [`<Loop durationInFrames>` must match the scene length](#9)

---

<a id="1"></a>
## 1. Composition ID ≠ filename

**Symptom:** `remotion render src/index.ts ProductReveal out/foo.mp4` errors with `Composition with id "ProductReveal" not found`. Or worse, succeeds but renders the wrong scene.

**Cause:** the CLI takes the **composition id** (the `id="…"` prop on `<Composition>` in `Root.tsx`), not the filename and not the component name. In the SimWorld project, the file is `ProductReveal.tsx`, the component is `ProductReveal`, but the registered id was `IntroducingSimWorldStudio`. The render command needs `IntroducingSimWorldStudio`.

**Fix:** before any render command, grep `Root.tsx`:

```bash
grep 'id=' src/Root.tsx
```

That's the source of truth. Either match the id in your render command, or rename the id to match the filename in `Root.tsx` (and update any `package.json` scripts referencing the old id).

**Prevent recurrence:** convention — make the composition id exactly match the scene file basename. `ProductReveal.tsx` → `id="ProductReveal"`. Reserve different ids only when you have multiple compositions on the same scene (e.g., `OpeningTitle` and `OpeningTitleTransparent`).

---

<a id="2"></a>
## 2. Defaults out of sync between scene file and `Root.tsx`

**Symptom:** Studio shows one set of defaults; the full-timeline render uses a different set. Or — you tweak a slider in Studio, click "Save default props", and the timeline still looks wrong.

**Cause:** the scene file exports `PRODUCT_REVEAL_DEFAULTS` which `Main.tsx` spreads into the embedded scene. Studio's "Save default props" button rewrites the `defaultProps={…}` literal in `Root.tsx` via AST. These are two separate objects. Updating one does not update the other.

**Fix:** treat the two as a manual sync. Whenever you update one, copy to the other.

```tsx
// scenes/ProductReveal.tsx
export const PRODUCT_REVEAL_DEFAULTS: ProductRevealProps = {
  titleSize: 168,  // ← update here…
  ...
};

// Root.tsx
<Composition
  id="ProductReveal"
  defaultProps={{
    titleSize: 168,  // ← …AND here
    ...
  }}
/>
```

Leave a code comment on both objects pointing at the other. There's no good way to derive one from the other — `defaultProps` must be a literal for Studio's AST writeback to work; if you pass `defaultProps={PRODUCT_REVEAL_DEFAULTS}` Studio can't write back.

---

<a id="3"></a>
## 3. `useCurrentFrame()` inside `<Sequence from>` returns relative frame

**Symptom:** a scene that animates perfectly when rendered standalone glitches or doesn't show when embedded in the main timeline via `<Sequence from={500}>`. Specifically: animations seem to be playing 500 frames late, or just hanging.

**Cause:** inside a `<Sequence from={N}>`, `useCurrentFrame()` returns `globalFrame - N`. So if you wrote `interpolate(frame, [500, 530], [0, 1])` thinking "fire at the 500th frame of the timeline", inside a Sequence starting at 500 the local frame is 0–30, never reaches 500, and nothing animates.

**Fix:** always design scenes against frame 0 — first beat starts at `frame === 0`, scene ends at `frame === durationInFrames`. The `from={...}` on the Sequence handles WHERE the scene lands in the global timeline; the scene itself doesn't know or care.

If you need the absolute frame for some reason (rare — e.g., syncing to a global audio track), use `useVideoConfig().fps * sceneStartSeconds + frame`. But almost always, redesign so you don't need it.

---

<a id="4"></a>
## 4. JSX comments at module scope break parsing

**Symptom:** `esbuild` error like `Unexpected "}"` or `Expected statement but found "/"` pointing at a line that looks fine.

**Cause:** `{/* comment */}` is JSX syntax — it's only valid INSIDE a JSX expression tree. Putting it at module scope, between statements, or between top-level function declarations is a parse error.

**Fix:** use `//` line comments or `/* block comments */` outside of JSX trees.

```tsx
// ✗ Breaks
{/* Defaults for this scene */}
export const FOO_DEFAULTS = { ... };

// ✓ Works
// Defaults for this scene
export const FOO_DEFAULTS = { ... };
```

This bites most often after copy-pasting a chunk of JSX into the wrong scope.

---

<a id="5"></a>
## 5. Shadowed imports compile silently

**Symptom:** a component renders, but uses a completely different version than the imported one. No errors. Often shows up as "my ProgressBar styling changes don't apply".

**Cause:** importing a component and then declaring a local `const` with the same name shadows the import. TypeScript and esbuild don't warn about it.

```tsx
import { ProgressBar } from "../components/ProgressBar";

// 50 lines later, in the same file:
const ProgressBar: React.FC = () => { ... };  // ← silently shadows the import

// All <ProgressBar /> below this point use the local one.
```

**Fix:** add `eslint-plugin-import` with `no-duplicates` and `no-shadow` rules to the scaffold's `.eslintrc`. The lint catches this immediately. Without lint, grep for `const ${ImportedName}` in the same file as `import.*${ImportedName}`.

---

<a id="6"></a>
## 6. Windows EPERM during ffmpeg cleanup

**Symptom:** at the end of a render, an error like:

```
EPERM: operation not permitted, unlink 'C:\Users\…\AppData\Local\Temp\…\encoder-tempfile'
```

The mp4 output was usually already written successfully.

**Cause:** Windows file locking — Remotion's ffmpeg child process is still releasing the temp file when the main process tries to clean it up. Transient.

**Fix:** check whether the output file exists and has reasonable size. If it does, the render succeeded — the error is just the cleanup step. If not, re-run; it almost always works the second time.

If it keeps happening: close other apps holding file locks (antivirus scanners, OneDrive sync on the output folder, Explorer windows open in the temp dir).

---

<a id="7"></a>
## 7. "File modified between Read and Edit" when Studio is open

**Symptom:** trying to edit a scene file and getting "file modified since read" errors from the editing tools.

**Cause:** Remotion Studio (or a linter/formatter watching the file) wrote to it after Claude read it. Or you manually saved between operations.

**Fix:** re-read the file, then re-apply the edit. This is normal — not a bug, just file-watcher overlap. If it happens repeatedly while iterating, close Studio briefly during heavy edits, or pause your formatter.

---

<a id="8"></a>
## 8. `aspectRatio` + flex fit — the right CSS combo

**Symptom:** trying to fit a 16:9 video panel into a parent container — it either overflows or shrinks to zero.

**Cause:** `aspectRatio` alone doesn't constrain a flex child enough. You need both width and height ceilings.

**Fix:** the working combo:

```tsx
<div style={{
  aspectRatio: "16 / 9",
  maxWidth: "100%",
  maxHeight: "100%",
  // Optional: width: "100%" if you want it to expand to the parent width.
}}>
  <OffthreadVideo ... />
</div>
```

**For the SimWorld layout specifically:** changing from `4 / 3` to `16 / 9` reduced the panel height. We had to add bottom padding on the scene's outer `<AbsoluteFill>` to reserve space for the `<ProgressBar>` that's absolutely-positioned at `bottom: 36`.

---

<a id="9"></a>
## 9. `<Loop durationInFrames>` must match the scene length

**Symptom:** a looping background video stutters or jumps to a different frame partway through a scene.

**Cause:** `<Loop durationInFrames={X}>` restarts the inner video every `X` frames. If `X` is shorter than the scene, the video restarts mid-scene. If `X` is longer, the video runs out and freezes on the last frame.

**Fix:** make `durationInFrames` equal to the scene's `<Composition durationInFrames>` (when rendering solo) OR the Sequence's `durationInFrames` (when embedded in `Main.tsx`).

```tsx
const SCENE_DUR = 360;  // 12s @ 30fps

<Loop durationInFrames={SCENE_DUR}>
  <OffthreadVideo src={...} />
</Loop>
```

If the source clip is naturally shorter than the scene and you genuinely want a hard loop, set `durationInFrames` to the source clip length. If the source is longer than you want, use `<OffthreadVideo startFrom={0} endAt={SCENE_DUR}>` to clip it.

---

## Pitfall meta-pitfall

When something is weird, suspect the framework before suspecting your code. Remotion's "frame is a pure function of code" model means animations are deterministic — if frame 30 looks wrong, frame 30 will always look wrong; you can scrub to it in Studio and inspect. There's no race condition, no timing flake. So:

1. Open Studio, scrub to the broken frame.
2. Comment things out until the bug disappears.
3. The last thing you commented out is the cause.

This loop is fast (single-frame preview re-renders in milliseconds). Use it before reaching for `console.log`.
