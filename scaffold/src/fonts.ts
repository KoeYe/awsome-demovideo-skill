// Font loading — run-once side effects. Import this from Root.tsx so the
// fonts are guaranteed loaded before any composition renders.

import { loadFont } from "@remotion/google-fonts/EBGaramond";
import { continueRender, delayRender, staticFile } from "remotion";

// Google font — handled entirely by @remotion/google-fonts.
loadFont();

// Local font (Helvetica Neue) — drop a HelveticaNeue.otf into public/fonts/
// and uncomment the block below. Without it the fontStack falls back to
// system Helvetica / Arial, which is fine for most uses.
//
// const handle = delayRender("loading Helvetica Neue");
// const font = new FontFace(
//   "Helvetica Neue",
//   `url(${staticFile("fonts/HelveticaNeue.otf")}) format("opentype")`,
// );
// font.load().then(() => {
//   document.fonts.add(font);
//   continueRender(handle);
// });
