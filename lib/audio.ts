"use client"

import { Howl, Howler } from "howler"

// Central voice system. Every recorded/generated clip under /public/audio is
// reachable through a helper here, so components never hand-write audio paths.
// VOICE is single-channel: starting a new line stops the previous one, so the
// child never hears two voices at once. (Game sound-effects that *should* layer
// still use lib/playSound.ts.)

const BASE = "/audio"
let currentVoice: Howl | null = null

// ── Mute toggle ────────────────────────────────────────────────────────────
// A single app-wide flag (persisted so a reload doesn't un-mute mid-lesson).
// playVoice checks it before starting a line — muted playback still advances
// (onend fires immediately) so lesson timers/sequencing never stall.
const MUTE_KEY = "kinda:muted"
let muted = typeof window !== "undefined" && window.localStorage?.getItem(MUTE_KEY) === "1"
const muteListeners = new Set<(muted: boolean) => void>()

export const isMuted = (): boolean => muted

export function setMuted(next: boolean): void {
  muted = next
  if (next) currentVoice?.stop()
  try {
    window.localStorage?.setItem(MUTE_KEY, next ? "1" : "0")
  } catch {
    // ignore (private mode / no storage)
  }
  muteListeners.forEach((fn) => fn(muted))
}

export const toggleMuted = (): void => setMuted(!muted)

/** Subscribe to mute changes; returns an unsubscribe function. */
export function onMuteChange(fn: (muted: boolean) => void): () => void {
  muteListeners.add(fn)
  return () => muteListeners.delete(fn)
}

// ── Speaking state ─────────────────────────────────────────────────────────
// True only while a voice line is actually sounding. Lets the teacher's
// flip-book character hold a still pose between lines and only animate while
// she is actually talking, instead of flip-booking continuously.
let speaking = false
const speakingListeners = new Set<(speaking: boolean) => void>()

export const isSpeaking = (): boolean => speaking

function setSpeaking(next: boolean): void {
  if (speaking === next) return
  speaking = next
  speakingListeners.forEach((fn) => fn(speaking))
}

/** Subscribe to speaking-state changes; returns an unsubscribe function. */
export function onSpeakingChange(fn: (speaking: boolean) => void): () => void {
  speakingListeners.add(fn)
  return () => speakingListeners.delete(fn)
}

// Browsers block audio until the user interacts with the page, so a voice line
// fired on mount (a greeting, the Step 0 prompt) would be silently dropped. We
// hold the most recent such line and play it the instant the child first taps,
// then play everything immediately from then on.
let unlocked = false
let pending: (() => void) | null = null
const unlockListeners = new Set<() => void>()

/** True once the page has had a user gesture and audio can actually play. */
export const isUnlocked = (): boolean => unlocked

/**
 * Force Howler's shared AudioContext into existence and resume it. Browsers
 * create a Web-Audio context in the "suspended" state and only allow the
 * transition to "running" from inside a user-gesture handler. Because a lesson's
 * first line is usually fired from a `setTimeout` a beat AFTER the tap (not in
 * the gesture itself), the context — created lazily by the first Howl — would be
 * born suspended and that first line silently dropped (the "no sound until you
 * refresh" bug). Calling this INSIDE the unlock gesture creates the context now
 * (`Howler.volume()` triggers Howler's setup) and resumes it, so every later
 * line plays. Cheap and idempotent, so we also call it on every gesture in case
 * a tab-switch or client navigation suspended the context again.
 */
function primeAudio(): void {
  try {
    Howler.volume() // no-arg call forces Howler to create its AudioContext
    const ctx = Howler.ctx
    if (ctx && ctx.state !== "running") void ctx.resume()
  } catch {
    // No Web Audio (or Howler internals changed) — nothing we can do; HTML5
    // fallback playback in Howl still works after a gesture.
  }
}

/**
 * Run `cb` as soon as audio is unlocked (immediately if it already is). Returns
 * an unsubscribe. Screens that auto-start a spoken lesson on mount use this so
 * their voices are never silently dropped by the browser's autoplay policy —
 * on a fresh load/refresh they simply wait for the child's first tap.
 */
export function whenUnlocked(cb: () => void): () => void {
  if (unlocked) {
    cb()
    return () => {}
  }
  unlockListeners.add(cb)
  return () => unlockListeners.delete(cb)
}

if (typeof window !== "undefined") {
  const unlock = () => {
    // Every gesture re-primes the context (idempotent) so audio that a
    // navigation/tab-switch suspended comes back without a page refresh.
    primeAudio()
    if (unlocked) return
    unlocked = true
    const run = pending
    pending = null
    run?.()
    unlockListeners.forEach((fn) => fn())
    unlockListeners.clear()
  }
  // NOT `once`: we keep listening so later taps can resume a context the OS or a
  // route change suspended. The handler is a no-op once unlocked + running.
  const opts: AddEventListenerOptions = { passive: true }
  window.addEventListener("pointerdown", unlock, opts)
  window.addEventListener("touchstart", unlock, opts)
  window.addEventListener("keydown", unlock, opts)
  window.addEventListener("click", unlock, opts)
  // Returning to the tab can leave the context suspended — resume on show.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && unlocked) primeAudio()
  })
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** Play one voice line, stopping whatever voice is currently playing. */
export function playVoice(src?: string, onend?: () => void): void {
  if (!src || muted) {
    onend?.()
    return
  }
  const run = () => {
    try {
      // A context suspended by a tab-switch/navigation would silently swallow
      // this line — nudge it back to running first (no-op when already running).
      const ctx = Howler.ctx
      if (ctx && ctx.state !== "running") void ctx.resume()
      currentVoice?.stop()
      const howl = new Howl({
        src: [src],
        onplay: () => setSpeaking(true),
        onend: () => {
          setSpeaking(false)
          onend?.()
        },
        onloaderror: () => {
          setSpeaking(false)
          onend?.()
        },
      })
      currentVoice = howl
      howl.play()
    } catch {
      setSpeaking(false)
      onend?.()
    }
  }
  // Before the first gesture, remember this line and play it on unlock.
  if (!unlocked) {
    pending = run
    return
  }
  run()
}

/** Play several voice lines back-to-back (each starts when the previous ends). */
export function playVoiceSequence(srcs: (string | undefined)[], onDone?: () => void): void {
  const list = srcs.filter(Boolean) as string[]
  const step = (i: number) => {
    if (i >= list.length) {
      onDone?.()
      return
    }
    playVoice(list[i], () => step(i + 1))
  }
  step(0)
}

/** Stop any voice that is currently playing (e.g. on unmount). */
export function stopVoice(): void {
  currentVoice?.stop()
  setSpeaking(false)
}

// ── Naming a specific thing ───────────────────────────────────────────────
export const speakWord = (word?: string, onend?: () => void): void =>
  playVoice(word ? `${BASE}/words/${slug(word)}.mp3` : undefined, onend)

export const speakLetterName = (letter?: string, onend?: () => void): void =>
  playVoice(letter ? `${BASE}/letters/names/${letter.toLowerCase()}.mp3` : undefined, onend)

export const speakLetterSound = (letter?: string, onend?: () => void): void =>
  playVoice(letter ? `${BASE}/letters/sounds/${letter.toLowerCase()}.mp3` : undefined, onend)

// Name a specific letter *case* out loud — "Capital letter A" / "Small letter a".
// Used in Step 1 so the child hears both forms as they are identified.
export const speakCapitalLetter = (letter?: string, onend?: () => void): void =>
  playVoice(letter ? `${BASE}/letters/capital/${letter.toLowerCase()}.mp3` : undefined, onend)

export const speakSmallLetter = (letter?: string, onend?: () => void): void =>
  playVoice(letter ? `${BASE}/letters/small/${letter.toLowerCase()}.mp3` : undefined, onend)

// ── Feedback pools (random pick keeps it fresh) ───────────────────────────
const POSITIVE = [
  "amazing", "brilliant", "excellent", "fantastic", "great-job", "hooray",
  "knew-you-could", "look-at-you-go", "perfect", "so-smart", "super-star",
  "superstar-learner", "well-done", "wonderful", "wow", "yes-correct",
  "you-did-it", "you-got-it",
  // Multi-accent variants (gen-numbers-audio.py) — more voices, same warmth.
  "amazing-uk", "brilliant-us", "wow-uk", "super-us", "great-work-in",
  "high-five-us", "excellent-uk", "clever-in",
]
const ENCOURAGING = [
  "almost-there", "dont-give-up", "keep-trying", "nice-try", "one-more-try",
  "so-close", "take-another-look", "thats-okay", "try-again", "you-can-do-it",
  // Multi-accent variants.
  "try-again-uk", "almost-us", "keep-going-in", "you-got-this-uk",
]
const COMPLETION = ["step-complete", "lets-keep-going", "new-reward", "ready-next-letter"]

export const playPositive = (onend?: () => void): void =>
  playVoice(`${BASE}/feedback/positive/${pick(POSITIVE)}.mp3`, onend)

export const playEncouraging = (onend?: () => void): void =>
  playVoice(`${BASE}/feedback/encouraging/${pick(ENCOURAGING)}.mp3`, onend)

/** Cheer on a correct answer, gently encourage on a wrong one. */
export const playFeedback = (correct: boolean, onend?: () => void): void =>
  correct ? playPositive(onend) : playEncouraging(onend)

export const playCompletion = (onend?: () => void): void =>
  playVoice(`${BASE}/feedback/completion/${pick(COMPLETION)}.mp3`, onend)

// ── Numbers (1–10) ────────────────────────────────────────────────────────
// Clips generated by scripts/gen-numbers-audio.py. Each number name exists in
// several accents ("", -uk, -us, -in) so counting games can echo the same
// number in different voices — variety keeps the repetition fresh.
const NUMBER_ACCENTS = ["", "-uk", "-us", "-in"]

/** The teacher's main voice saying the number name — "Three!" */
export const speakNumber = (n?: number, onend?: () => void): void =>
  playVoice(n != null ? `${BASE}/numbers/names/${n}.mp3` : undefined, onend)

/** The same number name in a randomly-picked accent (echo variety in games). */
export const speakNumberAnyVoice = (n?: number, onend?: () => void): void =>
  playVoice(n != null ? `${BASE}/numbers/names/${n}${pick(NUMBER_ACCENTS)}.mp3` : undefined, onend)

/** Count aloud up to n — "One, two, three!" */
export const playCountUp = (n?: number, onend?: () => void): void =>
  playVoice(n != null ? `${BASE}/numbers/count/${n}.mp3` : undefined, onend)

// ── Scripted lines by path ────────────────────────────────────────────────
/** e.g. playInstruction("step0/what-did-you-see") */
export const playInstruction = (path: string, onend?: () => void): void =>
  playVoice(`${BASE}/instructions/${path}.mp3`, onend)

/** e.g. playUi("welcome-back") */
export const playUi = (name: string, onend?: () => void): void =>
  playVoice(`${BASE}/ui/${name}.mp3`, onend)
