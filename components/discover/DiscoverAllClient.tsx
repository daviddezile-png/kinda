"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { RewardSystem, type RewardSystemRef } from "@/components/rewards/RewardSystem"
import type { RewardChestRef } from "@/components/rewards/RewardChest"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { BigButton } from "@/components/ui/BigButton"
import { Decor } from "@/components/ui/Decor"
import { Confetti } from "@/components/ui/Confetti"
import { MuteToggle } from "@/components/ui/MuteToggle"
import { DiscoverGallery, type GalleryFrame } from "@/components/discover/DiscoverGallery"
import { MadamWelcome } from "@/components/discover/MadamWelcome"
import { playCompletion, playInstruction, speakWord } from "@/lib/audio"
import { playSound } from "@/lib/playSound"
import type { Reward } from "@/types"

interface DiscoverAllClientProps {
  images: GalleryFrame[]
  /** Marks Level 0 done for the class's items, then routes onward. */
  onComplete: () => void
}

// Level 0 "See & Know": Madam (the teacher) welcomes the child first, then one
// continuous gallery of EVERY picture in the system, one large picture at a
// time and paced by the child. The gallery tours the pictures twice on its own
// (see DiscoverGallery's REQUIRED_LAPS), then this plays a congratulations line
// and offers the child a choice: watch it all again, or move on to the games.
export function DiscoverAllClient({ images, onComplete }: DiscoverAllClientProps) {
  const rewardRef = useRef<RewardSystemRef>(null)
  const chestRef = useRef<RewardChestRef>(null)

  // Madam greets the child before any pictures are shown.
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  // Flips true once the celebration applause has finished — then the celebrating
  // scene gives way to the teacher pointing down at the two buttons while she
  // tells the child which one does what.
  const [guide, setGuide] = useState(false)
  // Bumped on repeat to force DiscoverGallery to remount with fresh state.
  const [tourKey, setTourKey] = useState(0)

  const gift = useRef<Reward | null>(null)

  const handleAllSeen = () => {
    if (done) return
    setDone(true)
    gift.current = rewardRef.current?.giveReward() ?? null
  }

  useEffect(() => {
    if (!done) return
    // Name the gift the child just got ("Apple!") — like the letters lesson —
    // then celebrate: a cheer over the clapping, and only once the applause has
    // finished do we switch to the teacher pointing at the buttons and tell the
    // child which one does what, so nothing lands while the celebration is still
    // going. (speakWord with no name just calls straight through.)
    speakWord(gift.current?.name, () => {
      playCompletion()
      playSound("/audio/feedback/applause-wav.wav", 0.9, () => {
        setGuide(true)
        playInstruction("step0/discover-end")
      })
    })
  }, [done])

  const handleRepeat = () => {
    setDone(false)
    setGuide(false)
    setTourKey((k) => k + 1)
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#fff7fb]">
      <RewardSystem ref={rewardRef} onRewardGiven={() => {}} chestRef={chestRef} />
      <PlayfulBackground />

      {/* Top bar: Home on the left, the voice mute toggle where the corner
          mascot used to be (she's shown full-size in the welcome/finale). */}
      <header className="relative z-10 flex shrink-0 items-center justify-between px-5 py-4">
        <Link
          href="/student"
          aria-label="Home"
          className="grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-white/70 shadow"
        >
          <Decor name="home" size={30} />
        </Link>
        <MuteToggle />
      </header>

      {/* Gallery */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-4">
        {done && <Confetti />}
        {!started ? (
          <MadamWelcome onStart={() => setStarted(true)} />
        ) : done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            {/* Celebrating scene while the applause plays; once it finishes the
                teacher steps in pointing down at the buttons (see `guide`). */}
            <AnimatePresence mode="wait" initial={false}>
              {guide ? (
                <motion.img
                  key="guide"
                  src="/images/character/3d/discover-point-down.png"
                  alt=""
                  aria-hidden
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    opacity: { duration: 0.4 },
                    scale: { duration: 0.4 },
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="max-h-[34vh] w-auto object-contain drop-shadow-xl"
                />
              ) : (
                <motion.img
                  key="celebrate"
                  src="/images/character/3d/discover-celebration.png"
                  alt=""
                  aria-hidden
                  initial={{ opacity: 0, scale: 0.85, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 200, damping: 16 }}
                  className="max-h-[40vh] w-auto max-w-[80vw] object-contain drop-shadow-xl"
                />
              )}
            </AnimatePresence>
            <p className="max-w-md px-4 text-base font-semibold text-slate-600 sm:text-lg">
              Well done! Tap the blue button to watch the pictures again, or
              the star to keep going.
            </p>
            {/* The teacher above points the child to these two buttons — the
                blue one repeats the tour, the star moves on. */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-6"
            >
              <BigButton
                onClick={handleRepeat}
                ariaLabel="Watch the pictures again"
                className="from-[#8ec9ff] via-[#6fb3f5] to-[#4a9be0]"
              >
                <Decor name="repeat" size={34} />
              </BigButton>
              <BigButton onClick={onComplete} pulse ariaLabel="Continue to games">
                <Decor name="star" size={40} />
              </BigButton>
            </motion.div>
          </div>
        ) : (
          <DiscoverGallery
            key={tourKey}
            frames={images}
            onAllSeen={handleAllSeen}
            introSrc="/audio/instructions/step0/look-pictures.mp3"
          />
        )}
      </main>
    </div>
  )
}
