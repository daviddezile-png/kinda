"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Character3D } from "@/components/character/Character3D"
import {
  playVoiceSequence,
  stopVoice,
  isSpeaking,
  onSpeakingChange,
  whenUnlocked,
  isUnlocked,
} from "@/lib/audio"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"

interface LevelIntroProps {
  /** Voice lines played in order: welcome → what we'll learn → how to start. */
  lines: string[]
  /** Called when the last line ends (or the child taps to skip ahead). */
  onDone: () => void
  /**
   * sessionStorage key — when set, the full spoken intro plays only the FIRST
   * time this key is seen in the session; later visits (the next letter at the
   * same level) go straight into the lesson instead of repeating the welcome.
   */
  once?: string
}

// Every level opens the same way Level 0/1 do: the teacher welcomes the child,
// says what they will learn today, and how to start — before any lesson UI
// appears. Renders as a full-screen overlay inside the level's relative root.
// On a fresh load the browser blocks audio until a tap, so a gentle
// "tap to start" veil invites that first touch (same pattern as Step 1).
export function LevelIntro({ lines, onDone, once }: LevelIntroProps) {
  const started = useRef(false)
  const startedAt = useRef(0)
  const finished = useRef(false)
  const [locked, setLocked] = useState(false)
  const [speaking, setSpeaking] = useState(isSpeaking)
  useEffect(() => onSpeakingChange(setSpeaking), [])

  const t = getPhrases(useLanguage((s) => s.lang))

  // Latest onDone without retriggering the start effect.
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  const finish = () => {
    if (finished.current) return
    finished.current = true
    stopVoice()
    doneRef.current()
  }

  useEffect(() => {
    if (started.current) return
    // Already welcomed at this level this session → straight into the lesson.
    if (once) {
      try {
        if (window.sessionStorage.getItem(once) === "1") {
          finished.current = true
          doneRef.current()
          return
        }
      } catch {
        // no sessionStorage — just play the intro every time
      }
    }
    // Deliberate set-on-mount: locked can only be decided client-side (audio
    // unlock state), same pattern as Step1Client's veil.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocked(!isUnlocked())
    const begin = () => {
      if (started.current) return
      started.current = true
      startedAt.current = Date.now()
      setLocked(false)
      try {
        if (once) window.sessionStorage.setItem(once, "1")
      } catch {
        // ignore
      }
      playVoiceSequence(lines, () => {
        if (finished.current) return
        finished.current = true
        doneRef.current()
      })
    }
    // Defer the actual start by a tick. When audio is ALREADY unlocked (the
    // child tapped their way in from the map), whenUnlocked would otherwise run
    // begin() synchronously inside this effect — and in dev, React Strict Mode
    // mounts → cleans up → mounts again, so the greeting would start, get
    // stopVoice()'d by the throw-away cleanup, and never restart (the `started`
    // guard blocks it) — a silent, frozen welcome. Deferring lets the throw-away
    // mount's cleanup cancel the pending start before it fires; the real mount
    // then starts it exactly once. (On a fresh load audio is locked, so begin
    // waits for the unlock tap and this timer never even arms early.)
    let kick: ReturnType<typeof setTimeout> | null = null
    const off = whenUnlocked(() => {
      kick = setTimeout(begin, 0)
    })
    return () => {
      off()
      if (kick) clearTimeout(kick)
      // Only silence the greeting if we were interrupted mid-intro (e.g. the
      // child left the page). On a normal finish the lesson's FIRST line has
      // already started — stopping voice here would kill it and, since a
      // stopped Howl never fires onend, freeze the whole voice-driven chain.
      if (!finished.current) stopVoice()
    }
    // `lines` is stable per level; intentionally start-once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [once])

  return (
    // Tapping anywhere skips ahead — an eager child is never held hostage by
    // the welcome speech. (The very first tap is the audio unlock instead.)
    <button
      type="button"
      onClick={() => {
        // The unlock tap itself fires begin() (window listener) and THEN this
        // click — a grace window keeps that one tap from instantly skipping
        // the whole welcome it just started.
        if (started.current && Date.now() - startedAt.current > 700) finish()
      }}
      aria-label={locked ? t.startOver : t.next}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-white/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 16 }}
        animate={locked ? { opacity: 1, scale: [1, 1.08, 1], y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        transition={
          locked
            ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
            : { type: "spring", stiffness: 220, damping: 18 }
        }
        style={{ width: "clamp(11rem, 40vmin, 17rem)", aspectRatio: "1" }}
      >
        <span className="pointer-events-none absolute inset-0 -z-10 m-auto h-52 w-52 rounded-full bg-white/70 blur-2xl" />
        <Character3D state="welcome" size="100%" animate={locked ? true : speaking} />
      </motion.div>
      {/* Voice-only: no written label (pre-readers). The pulsing teacher is the
          cue to tap; her spoken welcome plays the moment audio unlocks. */}
    </button>
  )
}
