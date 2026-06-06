# remotion-demo-video

A **Claude skill** that distills a real production workflow for building polished 30–90s promotional / demo / explainer videos with [Remotion](https://www.remotion.dev/) 4.x.

Built by extracting the patterns, animation recipes, and pitfalls from shipping the [SimWorld Studio](https://github.com/KoeYe) academic-paper promo video — so you don't have to rediscover them.

---

## What this is (and isn't)

**This is** a Claude skill — a folder of markdown + scaffold code that Claude reads when you ask it to help with a Remotion video. When the skill is installed and you say something like *"make me a Remotion promo for my paper"*, Claude finds this skill, loads the workflow + reference files, and can act as a senior collaborator who already knows the layout, the gotchas, and the animation recipes that work.

**This is NOT** a replacement for Remotion. You still write React code, run `remotion render`, and ship MP4s. The skill just removes the "how should I structure this / which patterns work / why is the render command failing" friction.

**This is NOT** a fully generic Remotion library. It ships **one opinionated aesthetic** (cream warm palette, EB Garamond headlines + Helvetica Neue UI, a 4-stage ProgressBar pinned to the bottom). That's a deliberate choice — opinionated starts beat blank pages — but everything is in `scaffold/src/theme.ts` and can be swapped in 5 minutes.

---

## Requirements

You need:

| Requirement | Why |
|---|---|
| **[Remotion](https://www.remotion.dev/) 4.x** | The skill teaches Remotion patterns. The `scaffold/package.json` pins `^4.0.462`. |
| **Node.js 18+** & **npm** | To install Remotion and run `remotion studio` / `remotion render`. |
| **Claude Code** (or any Claude harness that supports skills) | To actually USE the skill. The skill is markdown + a scaffold — useless on its own. |

**Optional:**

- **`HelveticaNeue.otf`** in `scaffold/public/fonts/` — if you want the local UI font. Without it, the font stack falls back to system Helvetica / Arial (fine for most uses). EB Garamond loads automatically via `@remotion/google-fonts` — no font file needed.
- **ffmpeg** — Remotion bundles its own ffmpeg, so you don't normally need a system install. Only matters if you want to do downstream `.mov → .mp4` conversion outside Remotion.
- **DaVinci Resolve / Premiere / Final Cut** — if you plan to render transparent overlays (`--codec=prores --pixel-format=yuva444p10le --prores-profile=4444`) and composite them in a downstream editor.

**Platform:** developed and tested on Windows 11. Should work on macOS/Linux unchanged — see [pitfalls.md](./references/pitfalls.md#6) for the one Windows-specific gotcha (EPERM during ffmpeg cleanup; transient).

---

## Install the skill

The skill is a directory. Drop it where your Claude harness can find skills:

```bash
git clone https://github.com/KoeYe/awsome-demovideo-skill.git
```

Then place / symlink the `remotion-demo-video` folder into a skills directory Claude reads. For Claude Code:

- **Project-scoped** (only this project sees it):
  ```bash
  mkdir -p .claude/skills
  cp -r awsome-demovideo-skill .claude/skills/remotion-demo-video
  ```
- **User-scoped** (every Claude Code session sees it):
  ```bash
  mkdir -p ~/.claude/skills
  cp -r awsome-demovideo-skill ~/.claude/skills/remotion-demo-video
  ```

The skill announces itself via `SKILL.md`'s frontmatter description, which triggers on prompts like:

- *"make a Remotion video"* / *"build a promo video with Remotion"*
- *"demo video / trailer for my paper / product / repo"*
- *"add a scene to my Remotion project"*
- *"why is my Remotion render failing / showing the wrong scene"*
- *"how do I render a transparent overlay in Remotion"*

You don't have to remember the skill's name — Claude finds it from the description.

---

## What's in the box

```
remotion-demo-video/
├── SKILL.md                                   # Entry point Claude reads first
├── references/
│   ├── animation-recipes.md                   # Reveal, gradient text, camera zoom, glows, halo, underline sweep
│   ├── pitfalls.md                            # 9 specific gotchas with symptom/cause/fix
│   ├── render-commands.md                     # Every flag combo: mp4, ProRes alpha, PNG sequence
│   └── style-recipes.md                       # Palette hex, font setup, hero recipe, ProgressBar
└── scaffold/                                  # Minimal working Remotion project (cp -r to start)
    ├── package.json                           # Render scripts pre-wired
    ├── tsconfig.json
    ├── remotion.config.ts
    ├── scripts/sync-clips.mjs
    ├── public/{assets,clips}/                 # Drop your logos + screen captures here
    └── src/
        ├── index.ts                           # registerRoot(Root)
        ├── Root.tsx                           # Composition registry
        ├── Main.tsx                           # Full-timeline composer (Sequence blocks)
        ├── theme.ts                           # COLORS, FONTS, TIMELINE — edit me
        ├── fonts.ts                           # Font loading
        ├── components/
        │   ├── Reveal.tsx                     # fade + rise wrapper
        │   ├── Easing.ts                      # EASE_OUT, EASE_IN_OUT
        │   ├── ProgressBar.tsx                # 4-stage indicator
        │   └── VideoPlaceholder.tsx           # Stand-in for clips
        └── scenes/
            └── OpeningTitle.tsx               # One working example scene
```

---

## The end-to-end workflow this skill is designed for

The skill exists because of one specific loop we kept doing. The typical entry point isn't "I want an animated title" — it's **"I have a paper / spec / repo; turn it into a 60-second video"**. The skill makes that loop tractable.

```
1. Source material        →  paper PDF / project spec / existing repo
        ↓
2. Claude analyzes         →  extracts narrative beats; identifies what
                              each beat needs to SHOW (UI screen, recording,
                              chart, agent POV, etc.)
        ↓
3. Claude scaffolds       →  Remotion scenes with <VideoPlaceholder> slots
   with placeholders         + an ASSETS.md listing every clip the user
                              needs to record (slot name = filename;
                              duration, aspect, what to capture)
        ↓
4. User records footage   →  drops mp4s into public/clips/<slot>.mp4
                              matching slot names from the scaffold
        ↓
5. Claude swaps           →  replaces <VideoPlaceholder> with
   placeholders → clips      <OffthreadVideo src={staticFile("clips/...")}>
        ↓
6. Iterate scene-by-scene →  npm run render:<scene>, watch, tweak text,
                              animation, or timing, re-render. Code is fast;
                              re-recording footage is the slowest part of the
                              loop, so design slots to be re-shoot-resistant.
        ↓
7. Assemble in editor     →  per-scene MP4s into DaVinci / Premiere / FCP,
                              add music + voiceover + cross-scene
                              transitions, export.
```

The **slot-name convention** is what makes the handoff work: `<VideoPlaceholder slot="agent-loop">` corresponds to `public/clips/agent-loop.mp4`. Claude scaffolds with placeholders and writes the asset list; the user records to the listed names; swapping placeholder → real clip is a one-line change in the scene file. No retrofitting, no ambiguity about what's needed.

## Why scene-by-scene + downstream editor

After a few iterations on a real video, we converged on one specific way of working that we recommend strongly:

> **Render each scene as its own clip, then assemble + score in a downstream editor (DaVinci Resolve, Premiere, Final Cut). Don't treat the full-timeline MP4 as your primary deliverable.**

Why this works better than "render one big MP4 from Remotion":

| Pain point | Per-scene + editor | Full Remotion render |
|---|---|---|
| Tweak a scene's length by 1s | Drag the clip's edge in the editor | Edit `TIMELINE` in code, re-render the whole thing |
| Reorder scenes | Drag in the editor | Edit `Main.tsx` + `TIMELINE`, re-render |
| Add background music | Native to every editor | `<Audio>` + careful frame-syncing in code |
| Add voiceover with ducking | Trivial in editor | Hostile in Remotion |
| Cross-scene transitions (dissolves, dips to black) | One-click in editor | Hand-written interpolations |
| Iteration speed on one scene | Seconds (`npm run render:scene`) | Minutes (full timeline re-render) |
| Disk / render time when only one scene changed | One scene re-renders | Everything re-renders |

So the **primary npm scripts are the per-scene ones** (`render:opening`, `render:product`, etc.), and `npm run render` (full timeline) is mostly for preview / sanity-check / "I don't have an editor open" fallback.

**What Remotion is great at:** programmatic, repeatable, parametric scenes — animated titles, data-driven charts, UI mockups, anything you'd otherwise hand-keyframe. **What downstream editors are great at:** timing, audio, transitions, color grading. Use each for what it's good at.

For transparent overlays (lower-thirds, animated logos to composite over screen captures), use `npm run render:opening:transparent` — that produces a `.mov` with alpha that drops cleanly onto a track in the editor.

---

## Quickstart — bootstrap a new video

```bash
# 1. Clone (or copy) the scaffold to your project
cp -r awsome-demovideo-skill/scaffold ./my-promo
cd my-promo

# 2. Install
npm install

# 3. Open Remotion Studio for live editing
npm run dev    # http://localhost:3000

# 4. Render each scene as its own clip (this is the primary loop)
npm run render:opening      # → out/opening.mp4
# add more scenes, render each one as you finish it

# 5. (Optional) Render the full timeline as a preview / fallback
npm run render              # → out/full.mp4

# 6. Drag the per-scene clips into DaVinci / Premiere / Final Cut, arrange,
#    add music / voiceover / transitions, export.
```

Then ask Claude (with this skill installed):

> *"Add a scene called `FeatureGrid` that shows 4 product features in a 2×2 grid, each cell with a heading + a 1-line description, animated in one at a time."*

Claude will create `src/scenes/FeatureGrid.tsx` following the scene pattern, register it in `Root.tsx` with the inline-defaults pattern, add an `npm run render:features` script, and tell you how to embed it in the main timeline (if you want a full-timeline preview) — or just render it as a standalone clip you'll drop into your editor.

---

## Swapping the aesthetic (it's opinionated — that's fine)

The skill ships with the SimWorld Studio look: cream warm + EB Garamond + violet brand accent. **You don't have to keep it.** Edit `scaffold/src/theme.ts`:

- **Palette** — replace the `COLORS` object. The 4-stage `ProgressBar` and `OpeningTitle` reference `COLORS.bg`, `COLORS.violet`, `COLORS.ink2` — they'll pick up your new values automatically.
- **Fonts** — replace `TITLE_FONT_STACK` / `FONT_STACK`. For a different Google Font, swap `@remotion/google-fonts/EBGaramond` in `src/fonts.ts` for another package (e.g. `@remotion/google-fonts/Inter`).
- **ProgressBar stages** — edit the `STAGES` array in `scaffold/src/components/ProgressBar.tsx`. Or delete the `<ProgressBar>` calls entirely if you don't want one.

If you replace all three, what's left from the skill is still very useful: the scene pattern (schema + defaults + component), the animation recipes, the pitfalls reference, the render command conventions — all aesthetic-agnostic.

---

## Limitations & honest notes

- **One ProgressBar layout** — the bundled `ProgressBar` is a horizontal 4-stage pill pinned to the bottom of every scene. For 2-stage or 6-stage videos, edit the `STAGES` array and the spacing.
- **No audio scaffolding** — the SimWorld project was scored in a downstream editor, not Remotion. If you want music/voiceover inside Remotion, see [Remotion's `<Audio>` docs](https://www.remotion.dev/docs/audio) — the skill doesn't currently cover that.
- **No chart components bundled** — the SimWorld project has hand-rolled `<ChartAblation>`, `<ChartCoEvolve>` etc. that are too project-specific to scaffold generically. Build your own following the same scene pattern; the animation recipes (interpolate + Reveal + EASE_OUT) carry over.
- **Scaffold not exhaustively tested standalone** — the patterns are battle-tested in the SimWorld project, but the scaffold itself is a fresh distillation. If you hit an `npm install` or render-command issue, open an issue. Fixes welcome.
- **Windows-developed** — if you're on macOS/Linux and hit a path-separator or permission bug, please file an issue with the exact command and error.

---

## Provenance & acknowledgments

This skill was extracted from the production workflow for the [SimWorld Studio](https://github.com/KoeYe) academic-paper promo video — a 60-second multi-scene Remotion video covering environment generation, verification, embodied agent training, and co-evolution results.

Built collaboratively with Claude (Anthropic) — every recipe in `references/animation-recipes.md` was first solved in the SimWorld codebase, every pitfall in `references/pitfalls.md` cost real debugging time.

If you ship a video with this skill, a link back is appreciated but not required.

---

## License

MIT — do whatever you want, no warranty.
