"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { TracingCanvas } from "@/components/tracing/TracingCanvas"
import { LetterTransform } from "@/components/tracing/LetterTransform"
import { Character3D } from "@/components/character/Character3D"
import { RewardSystem, type RewardSystemRef } from "@/components/rewards/RewardSystem"
import { RewardChest, type RewardChestRef } from "@/components/rewards/RewardChest"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { Decor } from "@/components/ui/Decor"
import { LevelIntro } from "@/components/ui/LevelIntro"
import { MuteToggle } from "@/components/ui/MuteToggle"
import { playSound } from "@/lib/playSound"
import { playCompletion, playInstruction, playUi, speakWord } from "@/lib/audio"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { FinishButton } from "@/components/student/FinishButton"
import { Confetti } from "@/components/ui/Confetti"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { CharacterState, LetterData, Reward } from "@/types"

// Each case is traced WITH the guide, then written again SOLO (no guide) as a
// little test, before moving on.
type Phase = "uppercase" | "uppercaseSolo" | "transform" | "lowercase" | "lowercaseSolo" | "complete"

interface Step3ClientProps {
  letterData: LetterData
}

export function Step3Client({ letterData }: Step3ClientProps) {
  const rewardRef = useRef<RewardSystemRef>(null)
  const chestRef = useRef<RewardChestRef>(null)

  const [phase, setPhase] = useState<Phase>("uppercase")
  const [isTransforming, setIsTransforming] = useState(false)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [character, setCharacter] = useState<CharacterState>("teaching")
  // The teacher's welcome ("today we learn to write…") runs first; the lesson's
  // own opening lines wait until it finishes so voices never overlap.
  const [introDone, setIntroDone] = useState(false)

  const t = getPhrases(useLanguage((s) => s.lang))
  const upper = letterData.tracing.uppercase

  useEffect(() => {
    if (!introDone) return
    playSound(letterData.letterAudio)
    // "Now let's write the letter!" → "Trace the dots with your finger!"
    playInstruction("step3/lets-write", () => playInstruction("step3/trace-dots"))
  }, [introDone, letterData.letterAudio])

  // Drive the letter→image morph once the uppercase letter is fully traced.
  // (Character is set to "happy" at the moment we enter the transform phase, in
  // handleUppercaseComplete, so this effect only owns the morph timer.)
  useEffect(() => {
    if (phase !== "transform") return
    const t = setTimeout(() => setIsTransforming(true), 800)
    return () => clearTimeout(t)
  }, [phase])

  const handleSection = useCallback(() => {
    setCharacter("happy")
    playSound("/audio/feedback/correct.mp3")
    // Fly in the gift and say which one it is ("Apple!") — same as the letters
    // lesson. giveReward returns undefined when a gift is already flying.
    const gift = rewardRef.current?.giveReward()
    if (gift) speakWord(gift.name)
  }, [])

  const handleRewardGiven = useCallback((reward: Reward) => {
    setRewards((prev) => [...prev, reward])
  }, [])

  const handleUppercaseComplete = useCallback(() => {
    setCharacter("happy")
    // Guide hand done → now write it once by yourself (no guide) as a test.
    setPhase("uppercaseSolo")
    playInstruction("step3/write-yourself")
  }, [])

  const handleUppercaseSoloDone = useCallback(() => {
    setCharacter("happy")
    setPhase("transform")
  }, [])

  const handleTransformDone = useCallback(() => {
    // reward-audio folder removed — only play a transform sound if the letter
    // data supplies its own (no fallback into the deleted /audio/rewards folder).
    if (upper.transformSound) playSound(upper.transformSound)
    setCharacter("nom_nom")
    setTimeout(() => {
      setIsTransforming(false)
      setPhase("lowercase")
      setCharacter("teaching")
    }, 1500)
  }, [upper.transformSound])

  const handleLowercaseComplete = useCallback(() => {
    setCharacter("happy")
    setPhase("lowercaseSolo")
    playInstruction("step3/write-yourself")
  }, [])

  const handleComplete = useCallback(() => {
    setPhase("complete")
    setCharacter("celebrating")
    playSound("/audio/feedback/celebration.mp3")
    // Say it out loud, then point the child to the button to keep going.
    playCompletion(() => playUi("tap-next"))
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden" style={{ backgroundColor: letterData.backgroundColor }}>
      <RewardSystem ref={rewardRef} onRewardGiven={handleRewardGiven} chestRef={chestRef} />
      <RewardChest ref={chestRef} rewards={rewards} />
      <PlayfulBackground />

      {/* pr-20 reserves room for the fixed reward chest in the top-right corner
          so the mute toggle never sits underneath it. */}
      <header className="relative z-10 flex items-center gap-4 px-4 py-3 pr-20">
        <Link href="/student" className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-600">
          <span className="inline-flex items-center gap-1.5"><Decor name="home" size={18} />{t.home}</span>
        </Link>
        <ProgressBar current={3} total={5} step={3} totalSteps={4} />
        <MuteToggle className="h-11 w-11 shrink-0" />
      </header>

      <p className="relative z-10 px-4 text-center text-xl font-bold text-gray-700">
        {phase === "lowercase" || phase === "lowercaseSolo"
          ? t.traceLower(letterData.lowercase)
          : t.traceUpper(letterData.letter)}
      </p>

      <main className="relative z-10 grid flex-1 grid-cols-1 items-center gap-4 px-4 py-4 md:grid-cols-[180px_1fr]">
        <div className="flex justify-center">
          <Character3D state={character} size={180} />
        </div>

        <div className="flex flex-col items-center justify-center">
          {phase === "uppercase" && (
            <TracingCanvas
              letterData={letterData}
              isUppercase
              onSectionComplete={handleSection}
              onLetterComplete={handleUppercaseComplete}
            />
          )}

          {phase === "uppercaseSolo" && (
            <TracingCanvas
              letterData={letterData}
              isUppercase
              guide={false}
              onSectionComplete={handleSection}
              onLetterComplete={handleUppercaseSoloDone}
            />
          )}

          {phase === "transform" && (
            <LetterTransform
              letter={letterData.letter}
              transformImage={upper.transformImage ?? letterData.words[0].image}
              letterColor={letterData.color}
              isTransforming={isTransforming}
              onComplete={() => {
                if (isTransforming) handleTransformDone()
              }}
            />
          )}

          {phase === "lowercase" && (
            <TracingCanvas
              letterData={letterData}
              isUppercase={false}
              onSectionComplete={handleSection}
              onLetterComplete={handleLowercaseComplete}
            />
          )}

          {phase === "lowercaseSolo" && (
            <TracingCanvas
              letterData={letterData}
              isUppercase={false}
              guide={false}
              onSectionComplete={handleSection}
              onLetterComplete={handleComplete}
            />
          )}

          {phase === "complete" && (
            <div className="flex flex-col items-center gap-6">
              <Confetti />
              <h2 className="flex items-center justify-center gap-2 text-3xl font-black text-[#FF6B6B]">
                {t.writeWell(letterData.letter)} <Decor name="star" size={30} />
              </h2>
              <FinishButton letter={letterData.letter} level={3} sign>
                {t.next} →
              </FinishButton>
            </div>
          )}
        </div>
      </main>

      {!introDone && (
        <LevelIntro
          once="kinda:intro:write"
          lines={[
            "/audio/instructions/step3/welcome.mp3",
            "/audio/instructions/step3/what-learn.mp3",
            "/audio/instructions/step3/how-start.mp3",
          ]}
          onDone={() => setIntroDone(true)}
        />
      )}
    </div>
  )
}
