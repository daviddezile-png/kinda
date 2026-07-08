---
name: verify
description: How to run and drive Kinda (Next.js kids' letter app) to verify changes end-to-end — dev server reuse, headless-Edge CDP driving, lesson auto-tapping.
---

# Verifying Kinda changes

## Server

A dev server is usually ALREADY running (check before starting one):
`npm run dev` refuses to double-start and prints the existing port —
typically **http://localhost:3179**. Use the running one; do NOT kill it.
Log: `.next/dev/logs/next-development.log`.

DB (MySQL) is usually up too — `/student/choose` returning class/student
cards confirms it. Pages that need cookies: pick a student through
`/student/choose` first (server action sets `kinda_class`/`kinda_student`).

## Driving the UI

Plain `msedge --headless --screenshot` is unreliable here (framer-motion +
hydration don't settle under `--virtual-time-budget`, and `--timeout` dumps
pre-hydration DOM). Use **CDP via Node's native WebSocket** (no deps):
launch Edge with `--remote-debugging-port`, `--headless=new`,
`--autoplay-policy=no-user-gesture-required`, then talk JSON over
`webSocketDebuggerUrl` (Page.navigate / Runtime.evaluate /
Page.captureScreenshot / Emulation.setDeviceMetricsOverride for viewports).

Key routes: `/student/letters/{letter}/step/1` (lesson, no DB needed),
`/student/choose`, `/student/celebrate` (needs student cookie).

## Step 1 lesson is voice-paced

Transitions fire when audio clips END (real durations, ~2–8s per stage), so
fixed sleeps misfire. Poll every ~1.2s and click whatever is actionable:

- letter card: `button[aria-label^="Letter "]` (tap is a no-op until the
  glow/prompt phase — safe to spam)
- tour pictures & game options: buttons whose `aria-label` is the word
  (Apple, Ball…). Congrats reached when body text matches
  /Great job|You learned/.

Console via `Runtime.consoleAPICalled` catches hydration mismatches that
screenshots miss. Ignore dev-only `flushComponentPerformance` exceptions
from react-server-dom-turbopack in headless.
