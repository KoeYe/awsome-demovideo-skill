# Assets to record

This file is the **single source of truth** for what footage the user needs to record/provide. Claude fills this in when scaffolding scenes; the user reads it to know what to record.

For each row:
- **slot** — exact filename in `public/clips/<slot>.mp4`. Used by `<VideoPlaceholder slot="...">` and later `<OffthreadVideo src={staticFile("clips/<slot>.mp4")}>`.
- **scene** — which Remotion scene consumes this clip.
- **duration** — minimum length the scene needs. Longer is fine; shorter forces `<Loop>` and may stutter.
- **aspect** — recording aspect ratio. Match the target frame's aspect ratio to avoid letterboxing.
- **what to show** — concrete description. The more specific the better ("agent walking, hits a wall at 3s, resets at 5s, retries successfully" beats "agent doing stuff").

When the file is recorded and placed in `public/clips/`, mark its row as ✅.

---

## Clip list

| ✓ | slot | scene | duration | aspect | what to show |
|---|------|-------|----------|--------|--------------|
| ☐ | `opening-loop` | OpeningTitle | 4s | 16:9 1920×1080 | (optional) ambient background loop behind the opening title — e.g., subtle particles or a slow-pan establishing shot. Leave blank if scene is text-only on solid bg. |

<!-- Add a row per slot as scenes are added. Example rows for reference:

| ☐ | `agent-loop` | AgentLoop | 12s | 16:9 1920×1080 | Agent walking forward, hits dead-end at ~3s, screen flashes red and resets, agent retries with new direction. Continuous single take, no cuts. |
| ☐ | `ue5-viewport` | ProductReveal | 8s | 16:9 1280×720 OK | Screen capture of the UE5 editor viewport. Scene fully loaded. Slow orbit if possible; static is fine. |
| ☐ | `prompt-typing` | PromptIntro | 5s | square 1080×1080 | User typing the prompt "Generate a medieval village with cobblestone streets" into your product's input. Cursor visible. |
-->

---

## Recording tips

- **Resolution:** match or exceed the target composition (default 1920×1080). Recording 1080p for a 1080p target is fine; recording 720p forces an upscale that looks soft.
- **Frame rate:** 30fps or 60fps. Avoid 24fps (cinema) — it judders against the 30fps Remotion render.
- **Codec:** H.264 MP4 is universally fast. ProRes is overkill for source clips you're going to re-encode anyway.
- **Audio:** strip or ignore. Source-clip audio is muted in the scene by default (`muted` prop on `<OffthreadVideo>`).
- **Length:** record AT LEAST the duration needed; longer is fine (Remotion will use `startFrom` / `endAt` to trim). If the clip will loop, record one clean loop's worth.
- **Stability:** for screen captures, close notifications, hide the cursor where you can, and don't move windows mid-recording.
- **Naming:** save the file as exactly `<slot>.mp4` in `public/clips/`. Filenames are case-sensitive on Linux; stick to lowercase + hyphens.

## When a clip is ready

1. Drop it into `public/clips/<slot>.mp4`.
2. Open the scene file that uses that slot. Find the `<VideoPlaceholder slot="<slot>" ... />` line.
3. Replace with:
   ```tsx
   <OffthreadVideo
     src={staticFile("clips/<slot>.mp4")}
     muted
     style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
   />
   ```
4. `npm run render:<scene>` and check the result. If timing's off, expose timing-sensitive numbers (FAIL stamp at frame X, reward value at t=0.7) as scene props instead of re-recording.
5. Mark the row in this file as ✅.
