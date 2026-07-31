"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { motion } from "framer-motion"
import { Character3D } from "@/components/character/Character3D"
import { Picture } from "@/components/ui/Picture"
import { Confetti } from "@/components/ui/Confetti"
import { BigButton } from "@/components/ui/BigButton"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { playVoiceSequence, stopVoice } from "@/lib/audio"
import { playSound } from "@/lib/playSound"
import { advanceLevel } from "@/app/student/celebrate/actions"

interface CelebrateAllProps {
  studentName: string
  avatarImage: string
  avatarLabel: string
}

// The end-of-ALL-letters party: the teacher and the child's own character
// celebrate together in the middle of the screen — applause plays, then the
// concluding voice lines run in sequence while both figures dance. The child
// taps Continue when they're ready; that advances their level.
export function CelebrateAll({ studentName, avatarImage, avatarLabel }: CelebrateAllProps) {
  const [pending, startTransition] = useTransition()
  const started = useRef(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    playSound("/audio/feedback/applause.wav", 0.9)
    // "You learned all your letters!" → "So proud of you!" → "Big clap!" → "See you!"
    playVoiceSequence([
      "/audio/instructions/finale/all-letters.mp3",
      "/audio/instructions/finale/so-proud.mp3",
      "/audio/instructions/finale/big-clap.mp3",
      "/audio/instructions/finale/see-you.mp3",
    ])
    // Second round of claps as the "big clap" line lands, and reveal Continue
    // once the speech has had time to finish (voices are best-effort files).
    const claps = setTimeout(() => playSound("/audio/feedback/clap-short.wav", 0.8), 7000)
    const btn = setTimeout(() => setShowButton(true), 4000)
    return () => {
      clearTimeout(claps)
      clearTimeout(btn)
      stopVoice()
    }
  }, [])

  return (
    <div className="relative flex h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#fff7e6] to-[#ffe9f3] px-4">
      <PlayfulBackground />
      <Confetti count={60} />

      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6">
        {/* Teacher and the child's character celebrating together */}
        <div className="flex items-end justify-center gap-2 sm:gap-6">
          <motion.div
            animate={{ y: [0, -12, 0], rotate: [0, -2, 2, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "clamp(10rem, 38vmin, 15rem)", aspectRatio: "1" }}
          >
            <Character3D state="celebrating" size="100%" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -18, 0], rotate: [0, 6, -6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            style={{ width: "clamp(6rem, 24vmin, 10rem)", aspectRatio: "1" }}
          >
            <Picture
              src={avatarImage}
              alt={avatarLabel}
              className="h-full w-full object-contain drop-shadow-xl"
            />
          </motion.div>
        </div>

        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.3 }}
          className="text-center text-2xl font-black text-gray-800 sm:text-4xl"
        >
          {studentName}, you did it!
        </motion.h1>
        <p className="text-center text-base font-bold text-gray-500 sm:text-xl">
          You learned ALL your letters!
        </p>

        {showButton && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <BigButton
              pulse
              onClick={() => startTransition(async () => advanceLevel())}
            >
              {pending ? "…" : "Continue →"}
            </BigButton>
          </motion.div>
        )}
      </div>
    </div>
  )
}
