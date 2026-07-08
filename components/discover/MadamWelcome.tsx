"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Character3D } from "@/components/character/Character3D"
import { BigButton } from "@/components/ui/BigButton"
import { Decor } from "@/components/ui/Decor"
import { playVoiceSequence, stopVoice, isSpeaking, onSpeakingChange } from "@/lib/audio"

interface MadamWelcomeProps {
  /** Child taps Madam / the start button to begin the picture tour. */
  onStart: () => void
}

// "Madam" — the teacher (madam.png) — greets the child before the discovery
// gallery shows any pictures. Her `welcome` flip-book (waving, arms open,
// hand-to-heart) only plays while she is actually talking — she holds a still
// pose in between, rather than flip-booking continuously.
// Pre-reading stage: no words, just her greeting voice and one big start button.
export function MadamWelcome({ onStart }: MadamWelcomeProps) {
  const [speaking, setSpeaking] = useState(isSpeaking)
  useEffect(() => onSpeakingChange(setSpeaking), [])

  // A warmer, longer "hello, my dear child" greeting first (so it reads like
  // a real teacher talking to the child, not a flashcard prompt), then the
  // original short cues.
  useEffect(() => {
    playVoiceSequence([
      "/audio/ui/welcome-kid.mp3",
      "/audio/ui/welcome-back.mp3",
      "/audio/ui/lets-start.mp3",
      // End on a clear "tap the star to start" so the child knows what to do.
      "/audio/instructions/step0/tap-star-start.mp3",
    ])
    return () => stopVoice()
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      {/* Madam waves the child in. Tapping her also starts the tour. */}
      <motion.button
        type="button"
        onClick={onStart}
        aria-label="Madam is welcoming you — tap to start"
        className="relative cursor-pointer select-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        whileTap={{ scale: 0.96 }}
      >
        {/* Soft glow so she pops off the pink background. */}
        <span className="pointer-events-none absolute inset-0 -z-10 m-auto h-64 w-64 rounded-full bg-white/60 blur-2xl" />

        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Character3D state="welcome" size={340} animate={speaking} />
        </motion.div>
      </motion.button>

      {/* Big, icon-only start button (pre-reading: no words). The pulsing star
          itself is the "tap me" cue — no floating hand sign. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-1"
      >
        <BigButton onClick={onStart} pulse ariaLabel="Start looking at the pictures">
          <Decor name="star" size={40} />
        </BigButton>
      </motion.div>
    </div>
  )
}
