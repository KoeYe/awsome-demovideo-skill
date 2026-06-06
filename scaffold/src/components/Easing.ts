import { Easing } from "remotion";

// Calm professional curves. Avoid spring bounces.
export const EASE_OUT       = Easing.bezier(0.16, 1, 0.3, 1);   // easeOutQuart-ish
export const EASE_IN_OUT    = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_OUT_GENTLE = Easing.bezier(0.25, 0.1, 0.25, 1);
