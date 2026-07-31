"use client"

import { forwardRef, useImperativeHandle, useRef, useState, type RefObject } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ALL_REWARDS } from "@/data/rewards"
import { randomFrom } from "@/lib/utils"
import type { Reward } from "@/types"
import { Picture } from "@/components/ui/Picture"
import type { RewardChestRef } from "./RewardChest"

export interface RewardSystemRef {
  /** Fly a gift into the basket. Pass a specific reward to control which gift is
   *  shown/named (Level 1 announces it by name); omit for a random one. Returns
   *  the gift that was given so the caller can speak its name — or `undefined`
   *  when a gift is already flying (the call is ignored, so nothing to name). */
  giveReward: (reward?: Reward) => Reward | undefined
}

interface RewardSystemProps {
  onRewardGiven: (reward: Reward) => void
  chestRef: RefObject<RewardChestRef | null>
}

export const RewardSystem = forwardRef<RewardSystemRef, RewardSystemProps>(function RewardSystem(
  { onRewardGiven, chestRef },
  ref,
) {
  const [activeReward, setActiveReward] = useState<Reward | null>(null)
  const isAnimating = useRef(false)

  useImperativeHandle(ref, () => ({
    giveReward: (reward?: Reward): Reward | undefined => {
      if (isAnimating.current) return undefined
      isAnimating.current = true

      const chosen = reward ?? randomFrom(ALL_REWARDS)
      setActiveReward(chosen)
      // No gift sound here — the reward-audio folder was removed, and the lesson
      // speaks the gift's name instead (one voice at a time, never overlapping).

      setTimeout(() => {
        setActiveReward(null)
        isAnimating.current = false
        chestRef.current?.shake()
        onRewardGiven(chosen)
      }, 2800)
      return chosen
    },
  }))

  return (
    <AnimatePresence>
      {activeReward && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: "45vw", y: "-45vh", scale: 0.1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.4, times: [0, 0.6, 1] }}
            className="flex flex-col items-center"
          >
            <Picture
              src={activeReward.image}
              alt={activeReward.name}
              emoji={activeReward.emoji}
              emojiClassName="text-8xl"
              className="h-40 w-40 drop-shadow-2xl"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
