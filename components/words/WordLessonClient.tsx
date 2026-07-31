"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
import { WordBuild } from "@/components/words/WordBuild"
import { WordWrite } from "@/components/words/WordWrite"
import { MatchWordPicture } from "@/components/words/games/MatchWordPicture"
import { MissingLetter } from "@/components/words/games/MissingLetter"
import { markWordLetterComplete } from "@/lib/wordProgress"
import { ALL_REWARDS } from "@/data/rewards"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import {
  isSpeaking,
  onSpeakingChange,
  playInstruction,
  speakWord,
  spellThenSay,
  stopVoice,
} from "@/lib/audio"
import type { CharacterState, Reward } from "@/types"
import type { WordSet } from "@/data/words"

const CELEBRATION = "/audio/feedback/celebration.mp3"

type Phase = "intro" | "see" | "build" | "write" | "games" | "tally" | "celebrate"

interface WordLessonClientProps {
  set: WordSet
}

// One letter's words, taught the voice-driven way. Each word runs
// See & Say → Build (join letters) → Write; after all the words come two word
// games (match the picture, find the missing letter); then a gift tally and a
// celebration. The child collects a gift for every word written and every game
// won — and hears which gift it is, like the letters lesson.
export function WordLessonClient({ set }: WordLessonClientProps) {
  const router = useRouter()
  const words = set.words

  const [phase, setPhase] = useState<Phase>("intro")
  const [wordIndex, setWordIndex] = useState(0)
  const [gameIndex, setGameIndex] = useState(0)
  const [character, setCharacter] = useState<CharacterState>("teaching")
  const [earned, setEarned] = useState<Reward[]>([])
  const [speaking, setSpeaking] = useState(isSpeaking)
  useEffect(() => onSpeakingChange(setSpeaking), [])

  const word = words[wordIndex]

  const rewardRef = useRef<RewardSystemRef>(null)
  const chestRef = useRef<RewardChestRef>(null)
  const giftQueue = useRef<Reward[]>([])
  const giveGift = useCallback(() => {
    if (giftQueue.current.length === 0) giftQueue.current = shuffle(ALL_REWARDS)
    const gift = giftQueue.current.shift()
    rewardRef.current?.giveReward(gift)
    // Say which gift the child got — same warmth as the letters lesson.
    if (gift) speakWord(gift.name)
  }, [])

  useEffect(() => () => stopVoice(), [])

  // ── See & Say: picture + word, name it, spell it, then go build it ───────
  const startSee = useCallback(
    (i: number) => {
      const w = words[i]
      setWordIndex(i)
      setPhase("see")
      setCharacter("teaching")
      // "Let's make a word!" → "apple" → sound it out → "Now join the letters!"
      playInstruction("words/lets-make", () =>
        speakWord(w, () =>
          spellThenSay(w, () =>
            playInstruction("words/now-join", () => {
              setPhase("build")
              setCharacter("watching")
            }),
          ),
        ),
      )
    },
    [words],
  )

  // ── Build done: celebrate the word, then write it ────────────────────────
  const handleBuilt = useCallback(() => {
    setCharacter("excited")
    playInstruction("words/made-word", () =>
      speakWord(word, () =>
        playInstruction("words/now-write", () => {
          setPhase("write")
          setCharacter("watching")
        }),
      ),
    )
  }, [word])

  // ── Write done: read it back, give a gift, next word (or games) ──────────
  const handleWritten = useCallback(() => {
    setCharacter("celebrating")
    giveGift()
    playInstruction("words/wrote-word", () =>
      playInstruction("words/read-it", () =>
        speakWord(word, () => {
          if (wordIndex + 1 < words.length) {
            playInstruction("words/next-word", () => startSee(wordIndex + 1))
          } else {
            setPhase("games")
            setGameIndex(0)
            setCharacter("watching")
            playInstruction("words/lets-play")
          }
        }),
      ),
    )
  }, [word, wordIndex, words.length, giveGift, startSee])

  // ── Games → tally → celebration ──────────────────────────────────────────
  const handleGameDone = useCallback(() => {
    if (gameIndex + 1 < 2) {
      setGameIndex((i) => i + 1)
      return
    }
    setPhase("tally")
    setCharacter("happy")
    playInstruction("words/all-done", () =>
      setTimeout(() => {
        setPhase("celebrate")
        setCharacter("celebrating")
        playSound(CELEBRATION)
      }, 900),
    )
  }, [gameIndex])

  const finish = useCallback(() => {
    markWordLetterComplete(set.letter)
    router.push("/student/words")
  }, [set.letter, router])

  const teacherBig = phase === "see"

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden" style={{ backgroundColor: set.bg }}>
      <RewardSystem ref={rewardRef} onRewardGiven={(r) => setEarned((cur) => [...cur, r])} chestRef={chestRef} />
      <RewardChest ref={chestRef} rewards={earned} />
      <PlayfulBackground />

      {/* Home + mute on the LEFT so they never collide with the reward backpack
          in the top-right corner; pr-20 reserves room for it. */}
      <header className="relative z-10 flex items-center gap-3 px-4 py-3 pr-20">
        <Link href="/student/words" className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-600">
          <span className="inline-flex items-center gap-1.5"><Decor name="home" size={18} /></span>
        </Link>
        <MuteToggle className="h-11 w-11 shrink-0" />
        {(phase === "see" || phase === "build" || phase === "write") && (
          <div className="ml-auto flex items-center gap-1.5" aria-label={`word ${wordIndex + 1} of ${words.length}`}>
            {words.map((_, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full transition-colors"
                style={{ backgroundColor: i <= wordIndex ? set.color : "rgba(0,0,0,0.15)" }}
              />
            ))}
          </div>
        )}
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-6">
        {/* See & Say — teacher beside the big picture + the word to hear. */}
        {phase === "see" && (
          <div className={`flex w-full max-w-3xl items-center justify-center gap-4 ${teacherBig ? "flex-col sm:flex-row sm:gap-10" : ""}`}>
            <Character3D state={character} size={170} animate={speaking || character === "celebrating"} />
            <div className="flex flex-col items-center gap-3">
              <Picture src={undefined} alt={word} className="h-40 w-40 object-contain sm:h-48 sm:w-48" />
              <button
                type="button"
                onClick={() => speakWord(word)}
                className="shimmer-text text-5xl font-black lowercase sm:text-6xl"
                style={{ color: set.color }}
                aria-label={`hear the word ${word}`}
              >
                {word}
              </button>
            </div>
          </div>
        )}

        {phase === "build" && (
          <div className="flex w-full max-w-3xl flex-col items-center gap-4">
            <WordBuild key={word} word={word} color={set.color} onComplete={handleBuilt} />
          </div>
        )}

        {phase === "write" && (
          <div className="flex w-full max-w-3xl flex-col items-center gap-4">
            <WordWrite key={word} word={word} color={set.color} onComplete={handleWritten} />
          </div>
        )}

        {phase === "games" && (
          <div className="flex w-full max-w-3xl flex-col items-center gap-4">
            {gameIndex === 0 ? (
              <MatchWordPicture key="match" words={words} color={set.color} onReward={giveGift} onDone={handleGameDone} />
            ) : (
              <MissingLetter key="missing" words={words} color={set.color} onReward={giveGift} onDone={handleGameDone} />
            )}
          </div>
        )}

        {/* Gift tally — every gift the child collected this letter. */}
        {phase === "tally" && (
          <div className="flex w-full max-w-3xl flex-col items-center gap-4">
            <Character3D state="happy" size={160} animate={speaking} />
            {earned.length === 0 ? (
              <p className="text-center text-xl font-black text-gray-600">You did it!</p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {earned.map((r, i) => (
                  <motion.div
                    key={`${r.id}-${i}`}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 220, damping: 15 }}
                    className="rounded-3xl bg-white/85 p-2 shadow-lg ring-2 ring-white/70"
                  >
                    <Picture src={r.image} alt={r.name} className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === "celebrate" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <Confetti />
            <Character3D state="celebrating" size={220} />
            <h2 className="flex items-center gap-2 text-3xl font-black" style={{ color: set.color }}>
              {set.letter} words done! <Decor name="star" size={30} />
            </h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => startSee(0)}
                aria-label="Do these words again"
                className="btn-press grid h-16 w-16 place-items-center rounded-full bg-white/90 shadow-lg"
              >
                <Decor name="repeat" size={34} />
              </button>
              <BigButton onClick={finish} pulse ariaLabel="Continue">
                <Decor name="star" size={36} />
              </BigButton>
            </div>
          </div>
        )}
      </main>

      {phase === "intro" && (
        <LevelIntro
          once="kinda:intro:words"
          lines={[
            "/audio/instructions/words/welcome.mp3",
            "/audio/instructions/words/what-learn.mp3",
            "/audio/instructions/words/how-start.mp3",
          ]}
          onDone={() => startSee(0)}
        />
      )}
    </div>
  )
}
