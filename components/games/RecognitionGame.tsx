"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ImageCard, type CardState } from "@/components/games/ImageCard"
import { QuestionDisplay } from "@/components/games/QuestionDisplay"
import { LivesDisplay } from "@/components/games/LivesDisplay"
import { RoundIndicator } from "@/components/games/RoundIndicator"
import { Character3D } from "@/components/character/Character3D"
import { RewardSystem, type RewardSystemRef } from "@/components/rewards/RewardSystem"
import { RewardChest, type RewardChestRef } from "@/components/rewards/RewardChest"
import { DISTRACTORS } from "@/data/distractors"
import { playSound } from "@/lib/playSound"
import { playCompletion, playEncouraging, playInstruction, playPositive, playUi } from "@/lib/audio"
import { shuffle } from "@/lib/utils"
import { calculateStars, useStep2Store } from "@/store/gameStore"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { Decor } from "@/components/ui/Decor"
import { LevelIntro } from "@/components/ui/LevelIntro"
import { MuteToggle } from "@/components/ui/MuteToggle"
import { FinishButton } from "@/components/student/FinishButton"
import { Confetti } from "@/components/ui/Confetti"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { CharacterState, LetterData, Reward } from "@/types"

const TOTAL_ROUNDS = 3

interface RoundImage {
  uid: string
  word: string
  image: string
  isCorrect: boolean
}

interface RecognitionGameProps {
  letterData: LetterData
}

function buildRound(letterData: LetterData, round: number): RoundImage[] {
  const correctWord = letterData.words[(round - 1) % letterData.words.length]
  // Three large pictures per round (1 correct + 2 distractors), not a 2×2 wall.
  const wrong = shuffle(DISTRACTORS.filter((d) => !d.word.toUpperCase().startsWith(letterData.letter.toUpperCase()))).slice(0, 2)

  const cards: RoundImage[] = [
    { uid: `c-${round}`, word: correctWord.word, image: correctWord.image, isCorrect: true },
    ...wrong.map((w, i) => ({ uid: `w-${round}-${i}`, word: w.word, image: w.image, isCorrect: false })),
  ]
  return shuffle(cards)
}

export function RecognitionGame({ letterData }: RecognitionGameProps) {
  const rewardRef = useRef<RewardSystemRef>(null)
  const chestRef = useRef<RewardChestRef>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const round = useStep2Store((s) => s.round)
  const lives = useStep2Store((s) => s.lives)
  const totalErrors = useStep2Store((s) => s.totalErrors)
  const earnedRewards = useStep2Store((s) => s.earnedRewards)
  const isComplete = useStep2Store((s) => s.isComplete)
  const loseLife = useStep2Store((s) => s.loseLife)
  const resetLives = useStep2Store((s) => s.resetLives)
  const nextRound = useStep2Store((s) => s.nextRound)
  const addReward = useStep2Store((s) => s.addReward)
  const complete = useStep2Store((s) => s.complete)
  const reset = useStep2Store((s) => s.reset)

  const [images, setImages] = useState<RoundImage[]>([])
  const [result, setResult] = useState<{ uid: string; correct: boolean } | null>(null)
  const [character, setCharacter] = useState<CharacterState>("watching")
  // Teacher's welcome to the find-the-picture level plays before the game talks.
  const [introDone, setIntroDone] = useState(false)

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay)
    timers.current.push(id)
  }, [])

  useEffect(() => {
    reset()
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [reset])

  // Say what this stage is once, up front: "Now we are going to find pictures!"
  // The first round's prompt is delayed (below) so it does not cut this off.
  useEffect(() => {
    if (introDone) playInstruction("step2/lets-find")
  }, [introDone])

  // Build (or rebuild) the round's images whenever the round changes. This is a
  // deliberate reset-state-on-change: `images` is stateful (it gets reshuffled
  // in place when the child loses all lives), so it can't be pure-derived.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setImages(buildRound(letterData, round))
    setResult(null)
    setCharacter("watching")
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [letterData, round])

  const t = getPhrases(useLanguage((s) => s.lang))

  const handleSelect = useCallback(
    (card: RoundImage) => {
      if (result?.correct) return // already solved this round

      if (card.isCorrect) {
        setResult({ uid: card.uid, correct: true })
        setCharacter("celebrating")
        playSound("/audio/feedback/correct.mp3")
        playPositive()
        rewardRef.current?.giveReward()

        schedule(() => {
          if (round >= TOTAL_ROUNDS) {
            complete()
            setCharacter("celebrating")
            playSound("/audio/feedback/celebration.mp3")
            // Cheer, then tell the child which button to tap to move on.
            playCompletion(() => playUi("tap-next"))
          } else {
            nextRound()
          }
        }, 2800)
      } else {
        setResult({ uid: card.uid, correct: false })
        setCharacter("teaching")
        playSound("/audio/feedback/wrong-soft.mp3")
        playEncouraging()
        loseLife()

        const livesAfter = useStep2Store.getState().lives
        if (livesAfter <= 0) {
          // Restart the same round with reshuffled positions; refill lives.
          schedule(() => {
            resetLives()
            setImages((prev) => shuffle(prev))
            setResult(null)
          }, 1000)
        } else {
          schedule(() => setResult(null), 800)
        }
      }
    },
    [complete, loseLife, nextRound, resetLives, result, round, schedule],
  )

  const cardState = (card: RoundImage): CardState => {
    if (!result) {
      // Gentle help for a struggling child: on the last life, glow the answer.
      return lives <= 1 && card.isCorrect ? "hint" : "idle"
    }
    if (result.correct) return card.uid === result.uid ? "correct" : "dimmed"
    return card.uid === result.uid ? "wrong" : "idle"
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#FFF3E0]">
      <RewardSystem ref={rewardRef} onRewardGiven={(r: Reward) => addReward(r)} chestRef={chestRef} />
      <RewardChest ref={chestRef} rewards={earnedRewards} />
      <PlayfulBackground />

      <header className="relative z-10 flex items-center justify-between px-4 py-3">
        <Link href="/student" className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-600">
          <span className="inline-flex items-center gap-1.5"><Decor name="home" size={18} />{t.home}</span>
        </Link>
        <RoundIndicator currentRound={Math.min(round, TOTAL_ROUNDS)} totalRounds={TOTAL_ROUNDS} />
        <div className="flex items-center gap-2">
          <LivesDisplay lives={lives} />
          <MuteToggle className="h-11 w-11" />
        </div>
      </header>

      {isComplete ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <Confetti />
          <Character3D state="celebrating" size={220} />
          <h2 className="flex items-center justify-center gap-2 text-3xl font-black text-[#FF6B6B]">
            {t.amazingAll} <Decor name="star" size={30} />
          </h2>
          <div className="flex gap-2">
            {Array.from({ length: calculateStars(totalErrors) }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.2, type: "spring", stiffness: 300 }}
              >
                <Decor name="star" size={48} />
              </motion.span>
            ))}
          </div>
          <FinishButton letter={letterData.letter} level={2} sign>
            {t.next} →
          </FinishButton>
        </div>
      ) : (
        <>
          {/* Mounted only after the welcome so its spoken prompt (fired on a
              timer) can never cut the teacher's intro off mid-sentence. */}
          {introDone && (
            <QuestionDisplay
              letter={letterData.letter}
              color={letterData.color}
              audio={letterData.characterSpeech.touchPrompt}
              introDelayMs={round === 1 ? 2200 : 0}
            />
          )}

          <main className="relative z-10 grid flex-1 place-items-center px-4 py-6">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {images.map((card) => (
                <ImageCard
                  key={card.uid}
                  image={card.image}
                  word={card.word}
                  state={cardState(card)}
                  onSelect={() => handleSelect(card)}
                />
              ))}
            </div>
          </main>

          <footer className="relative z-10 flex justify-center pb-6">
            <Character3D state={character} size={140} />
          </footer>
        </>
      )}

      {!introDone && (
        <LevelIntro
          once="kinda:intro:find"
          lines={[
            "/audio/instructions/step2/welcome.mp3",
            "/audio/instructions/step2/what-learn.mp3",
            "/audio/instructions/step2/how-start.mp3",
          ]}
          onDone={() => setIntroDone(true)}
        />
      )}
    </div>
  )
}
