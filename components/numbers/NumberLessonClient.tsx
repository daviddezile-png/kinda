"use client"

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Character3D } from "@/components/character/Character3D"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { Picture } from "@/components/ui/Picture"
import { Decor } from "@/components/ui/Decor"
import { MuteToggle } from "@/components/ui/MuteToggle"
import { LevelIntro } from "@/components/ui/LevelIntro"
import { BigButton } from "@/components/ui/BigButton"
import { Confetti } from "@/components/ui/Confetti"
import { RewardSystem, type RewardSystemRef } from "@/components/rewards/RewardSystem"
import { RewardChest, type RewardChestRef } from "@/components/rewards/RewardChest"
import { NumeralCard } from "@/components/numbers/NumeralCard"
import { CountRow } from "@/components/numbers/CountRow"
import { NumberWrite } from "@/components/numbers/NumberWrite"
import { FindNumber } from "@/components/numbers/games/FindNumber"
import { CountAndChoose } from "@/components/numbers/games/CountAndChoose"
import { TapExactly } from "@/components/numbers/games/TapExactly"
import { NumberOrder } from "@/components/numbers/games/NumberOrder"
import { MatchQuantity } from "@/components/numbers/games/MatchQuantity"
import { CountAnimals } from "@/components/numbers/games/CountAnimals"
import type { NumberGameProps } from "@/components/numbers/games/shared"
import { markNumberComplete } from "@/lib/numberProgress"
import { ALL_REWARDS } from "@/data/rewards"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import {
  isSpeaking,
  onSpeakingChange,
  playInstruction,
  speakNumber,
  speakWord,
  stopVoice,
} from "@/lib/audio"
import type { CharacterState, Reward } from "@/types"
import type { NumberData } from "@/data/numbers"

const CELEBRATION = "/audio/feedback/celebration.mp3"
const TOUCH_SFX = "/audio/sfx/touch.mp3"
const NUDGE_GAP = 4000 // silence before gently re-asking "touch the number!"

// The six games every number gets — recognition, counting, quantity and
// sequence, ending on real-photo counting. Fixed order: each game builds on
// the one before it.
const GAMES: ComponentType<NumberGameProps>[] = [
  FindNumber,
  CountAndChoose,
  TapExactly,
  NumberOrder,
  MatchQuantity,
  CountAnimals,
]

type Phase = "intro" | "teach" | "touch" | "count" | "word" | "write" | "games" | "tally" | "celebrate"

interface NumberLessonClientProps {
  data: NumberData
}

// One number, taught the Step-1 way: everything is voice-driven, every
// transition fires when the current line ends, and the child answers by
// touching — never by reading. Flow: teacher introduces the digit → child
// touches it → count-along (touch each object as it is counted) → the number
// word → six games → applause.
export function NumberLessonClient({ data }: NumberLessonClientProps) {
  const router = useRouter()
  const n = data.value

  const [phase, setPhase] = useState<Phase>("intro")
  const [numeralVisible, setNumeralVisible] = useState(false)
  const [character, setCharacter] = useState<CharacterState>("teaching")
  const [lit, setLit] = useState<number[]>([])
  const [gameIndex, setGameIndex] = useState(0)
  const [earnedRewards, setEarnedRewards] = useState<Reward[]>([])
  const [speaking, setSpeaking] = useState(isSpeaking)
  useEffect(() => onSpeakingChange(setSpeaking), [])

  // Gifts: like the letters lesson, the child collects a gift for writing the
  // number and one for every game won; the backpack fills and the tally screen
  // shows them all at the end. A per-lesson shuffled queue keeps them varied.
  const rewardRef = useRef<RewardSystemRef>(null)
  const chestRef = useRef<RewardChestRef>(null)
  const giftQueue = useRef<Reward[]>([])
  const giveGift = useCallback(() => {
    if (giftQueue.current.length === 0) giftQueue.current = shuffle(ALL_REWARDS)
    const gift = giftQueue.current.shift()
    rewardRef.current?.giveReward(gift)
    // Say which gift the child got ("Apple!"), like the letters lesson. The
    // game's own win cheer has already finished by the time a gift is given.
    if (gift) speakWord(gift.name)
  }, [])

  const nudge = useRef<ReturnType<typeof setInterval> | null>(null)
  // The child may touch the digit BEFORE the teacher finishes naming it (the
  // phase flips to "touch" only when her line ends). Accept the early touch —
  // once — instead of letting it stop the voice chain and freeze the lesson.
  const touchDone = useRef(false)
  const litRef = useRef<number[]>([])
  const clearNudge = useCallback(() => {
    if (nudge.current !== null) {
      clearInterval(nudge.current)
      nudge.current = null
    }
  }, [])

  useEffect(
    () => () => {
      clearNudge()
      stopVoice()
    },
    [clearNudge],
  )

  // ── Teach: "This is the number three!" → digit pops in → "Three!" ────────
  const startTeach = useCallback(() => {
    clearNudge()
    setPhase("teach")
    setNumeralVisible(false)
    setLit([])
    litRef.current = []
    touchDone.current = false
    setGameIndex(0)
    setEarnedRewards([]) // fresh basket each time the number is (re)started
    giftQueue.current = []
    setCharacter("teaching")
    // Per-number welcome first — "Today we are going to learn the number
    // three!" — then the digit is introduced.
    playInstruction(`numbers/welcome/${n}`, () =>
    playInstruction(`numbers/intro/${n}`, () => {
      setNumeralVisible(true)
      speakNumber(n, () => {
        setPhase("touch")
        setCharacter("watching")
        playInstruction("numbers/touch-number")
        // Gently re-ask until the child touches the digit.
        nudge.current = setInterval(() => playInstruction("numbers/touch-number"), NUDGE_GAP)
      })
    }))
  }, [n, clearNudge])

  // ── Touch: the child touches the big digit ───────────────────────────────
  const handleNumeralTouch = useCallback(() => {
    if (phase === "teach" || phase === "touch") {
      if (touchDone.current) return
      touchDone.current = true
      clearNudge()
      playSound(TOUCH_SFX)
      setCharacter("happy")
      speakNumber(n, () =>
        playInstruction("numbers/lets-count", () => {
          setPhase("count")
          setCharacter("watching")
        }),
      )
      return
    }
    // During the count the digit still answers with its name — but never once
    // the final count's voice chain is running (a tap would cut it dead).
    if (phase === "count" && litRef.current.length < n) speakNumber(n)
  }, [phase, n, clearNudge])

  // ── Count-along: touch each object; the teacher counts each touch ────────
  const handleCountTap = useCallback(
    (i: number) => {
      if (lit.includes(i)) return
      const k = lit.length + 1
      litRef.current = [...lit, i]
      setLit((prev) => [...prev, i])
      playSound(TOUCH_SFX)
      if (k < n) {
        speakNumber(k)
        return
      }
      // Last one! "Three! … There are three stars!" → the word.
      setCharacter("happy")
      speakNumber(k, () =>
        playInstruction(`numbers/there-are/${n}`, () => {
          setPhase("word")
          setCharacter("teaching")
          playInstruction(`numbers/word/${n}`, () =>
            setTimeout(() => {
              setPhase("write")
              setCharacter("watching")
            }, 800),
          )
        }),
      )
    },
    [lit, n],
  )

  // ── Games → gift tally → celebration ─────────────────────────────────────
  const startCelebrate = useCallback(() => {
    setPhase("celebrate")
    setCharacter("celebrating")
    // Use the shared celebration voice/music clip (not the plain applause).
    playSound(CELEBRATION)
    playInstruction(`numbers/learned/${n}`)
  }, [n])

  // Show every gift the child collected, then celebrate.
  const startTally = useCallback(() => {
    setPhase("tally")
    setCharacter("happy")
    // "Look at all the gifts you collected! I am so proud of you!" (shared line)
    playInstruction("step1/look-gifts", () => setTimeout(startCelebrate, 900))
  }, [startCelebrate])

  const handleGameComplete = useCallback(() => {
    giveGift() // a gift for every game won
    if (gameIndex + 1 < GAMES.length) {
      setTimeout(() => setGameIndex((i) => i + 1), 1100)
      return
    }
    setTimeout(startTally, 1100)
  }, [gameIndex, giveGift, startTally])

  const finishNumber = useCallback(() => {
    markNumberComplete(n)
    router.push("/student/numbers")
  }, [n, router])

  const CurrentGame = GAMES[gameIndex]
  const teacherAlone = phase === "teach" && !numeralVisible

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ backgroundColor: data.bg }}
    >
      <RewardSystem ref={rewardRef} onRewardGiven={(r) => setEarnedRewards((cur) => [...cur, r])} chestRef={chestRef} />
      <RewardChest ref={chestRef} rewards={earnedRewards} />
      <PlayfulBackground />

      {/* Home + mute sit LEFT so they never collide with the fixed reward
          backpack in the top-right corner; pr-20 reserves room for it. */}
      <header className="relative z-10 flex items-center gap-3 px-4 py-3 pr-20">
        <Link
          href="/student/numbers"
          className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-600"
        >
          <span className="inline-flex items-center gap-1.5">
            <Decor name="home" size={18} />
          </span>
        </Link>
        <MuteToggle className="h-11 w-11 shrink-0" />
        {phase === "games" && (
          <div className="ml-auto flex items-center gap-1.5" aria-label={`game ${gameIndex + 1} of ${GAMES.length}`}>
            {GAMES.map((_, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full transition-colors"
                style={{ backgroundColor: i <= gameIndex ? data.color : "rgba(0,0,0,0.15)" }}
              />
            ))}
          </div>
        )}
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-6">
        {(phase === "teach" || phase === "touch" || phase === "count" || phase === "word") && (
          <div
            className={`flex w-full max-w-4xl items-center justify-center gap-4 ${
              teacherAlone ? "" : "flex-col sm:flex-row sm:gap-10"
            }`}
          >
            {/* The teacher — centre-stage alone while she introduces, then
                beside the content, animating only while she speaks. */}
            <motion.div layout transition={{ type: "spring", stiffness: 200, damping: 22 }}>
              <Character3D
                state={character}
                size={teacherAlone ? 260 : 170}
                animate={speaking || character === "celebrating"}
              />
            </motion.div>

            {!teacherAlone && (
              <div className="flex flex-col items-center gap-6">
                {(phase === "teach" || phase === "touch") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 240, damping: 16 }}
                  >
                    <NumeralCard
                      value={n}
                      color={data.color}
                      size={210}
                      onClick={handleNumeralTouch}
                      state={phase === "touch" ? "hint" : "idle"}
                      ariaLabel={`touch the number ${n}`}
                    />
                  </motion.div>
                )}

                {phase === "count" && (
                  <>
                    <NumeralCard value={n} color={data.color} size={110} onClick={handleNumeralTouch} />
                    <CountRow object={data.object} count={n} lit={lit} onTap={handleCountTap} size={90} />
                  </>
                )}

                {phase === "word" && (
                  <div className="flex flex-col items-center gap-4">
                    <NumeralCard value={n} color={data.color} size={170} />
                    <motion.span
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="shimmer-text text-5xl font-black lowercase tracking-wide sm:text-6xl"
                      style={{ color: data.color }}
                    >
                      {data.word}
                    </motion.span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {phase === "write" && (
          <NumberWrite
            data={data}
            onComplete={() => {
              giveGift() // a gift for finishing the writing
              setPhase("games")
              setCharacter("watching")
            }}
          />
        )}

        {phase === "games" && (
          <div className="flex w-full max-w-3xl flex-col items-center gap-4">
            <CurrentGame key={gameIndex} data={data} onComplete={handleGameComplete} />
          </div>
        )}

        {/* Gift tally — every gift the child collected this number. */}
        {phase === "tally" && (
          <div className="flex w-full max-w-3xl flex-col items-center gap-4">
            <div style={{ width: "clamp(9rem, 32vmin, 13rem)", aspectRatio: "1" }}>
              <Character3D state="happy" size="100%" animate={speaking} />
            </div>
            {earnedRewards.length === 0 ? (
              <p className="text-center text-xl font-black text-gray-600">You did it!</p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {earnedRewards.map((r, i) => (
                  <motion.div
                    key={`${r.id}-${i}`}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.12, type: "spring", stiffness: 220, damping: 15 }}
                    className="rounded-3xl bg-white/85 p-2 shadow-lg ring-2 ring-white/70"
                  >
                    <span className="block" style={{ width: "clamp(4rem, 15vmin, 6.5rem)", aspectRatio: "1" }}>
                      <Picture src={r.image} alt={r.name} emoji={r.emoji} className="h-full w-full object-contain" />
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === "celebrate" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <Confetti />
            <Character3D state="celebrating" size={230} />
            <div className="flex items-center gap-3">
              <NumeralCard value={n} color={data.color} size={110} />
              <span className="shimmer-text text-4xl font-black lowercase" style={{ color: data.color }}>
                {data.word}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* Repeat the whole number… */}
              <button
                type="button"
                onClick={startTeach}
                aria-label="Do this number again"
                className="btn-press grid h-16 w-16 place-items-center rounded-full bg-white/90 shadow-lg"
              >
                <Decor name="repeat" size={34} />
              </button>
              {/* …or move on to the numbers map (next number unlocks there). */}
              <BigButton onClick={finishNumber} pulse ariaLabel="Continue">
                <Decor name="star" size={36} />
              </BigButton>
            </div>
          </div>
        )}
      </main>

      {phase === "intro" && (
        <LevelIntro
          once="kinda:intro:numbers"
          lines={[
            "/audio/instructions/numbers/welcome.mp3",
            "/audio/instructions/numbers/what-learn.mp3",
            "/audio/instructions/numbers/how-start.mp3",
          ]}
          onDone={startTeach}
        />
      )}
    </div>
  )
}
