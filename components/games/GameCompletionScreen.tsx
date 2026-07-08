"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Character3D } from "@/components/character/Character3D"
import { FinishButton } from "@/components/student/FinishButton"
import { Confetti } from "@/components/ui/Confetti"
import { Picture } from "@/components/ui/Picture"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import { markLetterComplete } from "@/lib/progress"
import { playVoiceSequence } from "@/lib/audio"
import type { Reward } from "@/types"

interface GameCompletionScreenProps {
  letter: string
  letterColor: string
  totalStars: number
  maxStars: number
  rewards: Reward[]
}

export function GameCompletionScreen({
  letter,
  letterColor,
  totalStars,
  maxStars,
  rewards,
}: GameCompletionScreenProps) {
  const t = getPhrases(useLanguage((s) => s.lang))

  // Letter finished — unlock the next one, and celebrate out loud with the
  // "step complete" + star-count lines.
  useEffect(() => {
    markLetterComplete(letter)
    const starFile =
      totalStars >= 3 ? "earned-three-stars" : totalStars === 2 ? "earned-two-stars" : totalStars === 1 ? "earned-one-star" : null
    playVoiceSequence([
      "/audio/feedback/completion/step-complete.mp3",
      starFile ? `/audio/feedback/completion/${starFile}.mp3` : undefined,
      // Finally, point the child to the button to move on to more letters.
      "/audio/ui/tap-next.mp3",
    ])
  }, [letter, totalStars])

  return (
    <div className="relative z-10 flex flex-col items-center gap-6 px-4 py-8 text-center">
      <Confetti />
      <Character3D state="celebrating" size={220} />
      <h2 className="text-4xl font-black" style={{ color: letterColor }}>
        {t.finishedLetter(letter)}
      </h2>
      <p className="text-2xl font-bold text-gray-600">{t.starsOf(totalStars, maxStars)}</p>

      {rewards.length > 0 && (
        <div className="flex max-w-md flex-wrap justify-center gap-2">
          {rewards.map((reward, i) => (
            <motion.div
              key={`${reward.id}-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Picture src={reward.image} alt={reward.name} emoji={reward.emoji} emojiClassName="text-3xl" className="h-12 w-12" />
            </motion.div>
          ))}
        </div>
      )}

      <FinishButton letter={letter} level={4} sign>
        {t.moreLetters} →
      </FinishButton>
    </div>
  )
}
