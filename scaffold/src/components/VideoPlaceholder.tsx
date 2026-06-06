import React from "react";
import { COLORS, FONT_MONO } from "../theme";

// Placeholder card for a clip slot. Swap to <OffthreadVideo> once you
// have the actual clip in public/clips/<slot>.mp4.
//
// Usage:
//   <VideoPlaceholder slot="agent-loop" description="Agent walking in the env" />
//
// Pass `accent` for a colored corner band that matches the panel's
// status (blue/green/violet/orange).
export const VideoPlaceholder: React.FC<{
  slot: string;
  description?: string;
  accent?: string;
  children?: React.ReactNode;
}> = ({ slot, description, accent = COLORS.violet, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `repeating-linear-gradient(45deg, ${COLORS.bgTint} 0 12px, ${COLORS.bgAlt} 12px 24px)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      color: COLORS.ink2,
      fontFamily: FONT_MONO,
      fontSize: 18,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        padding: "4px 12px",
        background: accent,
        color: "#fff",
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        borderBottomRightRadius: 8,
      }}
    >
      {slot}
    </div>
    {description ? (
      <div style={{ maxWidth: "70%", textAlign: "center", lineHeight: 1.4 }}>
        {description}
      </div>
    ) : null}
    {children}
  </div>
);
