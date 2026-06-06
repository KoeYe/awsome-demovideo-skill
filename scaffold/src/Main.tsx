import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { COLORS, TIMELINE } from "./theme";
import { OpeningTitle, OPENING_TITLE_DEFAULTS } from "./scenes/OpeningTitle";

// Main timeline — stitches scenes together via <Sequence from durationInFrames>.
// Add scenes by:
//   1. importing { Foo, FOO_DEFAULTS } from "./scenes/Foo"
//   2. adding a TIMELINE entry in theme.ts
//   3. adding a <Sequence from={TIMELINE.foo.start} durationInFrames={TIMELINE.foo.dur}>
//        <Foo {...FOO_DEFAULTS} />
//      </Sequence> block below
//   4. bumping TOTAL_FRAMES in theme.ts

export const Main: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <Sequence
      from={TIMELINE.opening.start}
      durationInFrames={TIMELINE.opening.dur}
    >
      <OpeningTitle {...OPENING_TITLE_DEFAULTS} />
    </Sequence>

    {/* Add more <Sequence> blocks here as you build the timeline */}
  </AbsoluteFill>
);
