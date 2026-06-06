import React from "react";
import { Composition } from "remotion";

// Side-effect import — registers @font-face / google-fonts before any
// composition renders.
import "./fonts";

import { FPS, TOTAL_FRAMES, VIDEO_H, VIDEO_W } from "./theme";
import { Main } from "./Main";
import {
  OpeningTitle,
  openingTitleSchema,
} from "./scenes/OpeningTitle";

// Root.tsx is the composition registry. Every renderable thing is a
// <Composition> entry. The CLI's render command takes the `id`, not the
// component name (see references/pitfalls.md #1).
//
// For each scene, register BOTH:
//   • a standalone composition (for fast solo rendering while iterating)
//   • implicitly the main timeline via Main.tsx (registered once below)
//
// ⚠ The defaultProps={} literal MUST be inline (not an imported constant).
// Remotion Studio's "Save default props" button writes back via AST and
// can only mutate inline literals. Keep this in sync with the exported
// X_DEFAULTS constant in the scene file. See pitfalls.md #2.

export const Root: React.FC = () => (
  <>
    {/* Full timeline — composes all scenes with <Sequence>. */}
    <Composition
      id="MainTimeline"
      component={Main}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={VIDEO_W}
      height={VIDEO_H}
    />

    {/* Standalone — opening title only. */}
    <Composition
      id="OpeningTitle"
      component={OpeningTitle}
      durationInFrames={120}        // 4s @ 30fps
      fps={FPS}
      width={VIDEO_W}
      height={VIDEO_H}
      schema={openingTitleSchema}
      defaultProps={{
        // INLINE COPY of OPENING_TITLE_DEFAULTS — keep in sync.
        title:        "My Product",
        subtitle:     "Automatic Environment Generation for Embodied Training",
        highlight:    "Environment Generation",
        titleSize:    168,
        subtitleSize: 56,
      }}
    />

    {/* Register additional scenes here as you build them. */}
  </>
);
