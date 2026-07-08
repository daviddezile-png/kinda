"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Picture } from "@/components/ui/Picture"
import { Decor } from "@/components/ui/Decor"
import type { Reward } from "@/types"

export interface RewardChestRef {
  shake: () => void
}

interface RewardChestProps {
  rewards: Reward[]
}

export const RewardChest = forwardRef<RewardChestRef, RewardChestProps>(function RewardChest(
  { rewards },
  ref,
) {
  const [isShaking, setIsShaking] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    shake: () => {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
    },
  }))

  return (
    <>
      <motion.button
        type="button"
        className="fixed top-4 right-4 z-40 rounded-full bg-yellow-400 p-3 shadow-lg"
        animate={isShaking ? { rotate: [-5, 5, -5, 5, -3, 3, 0] } : { rotate: 0 }}
        transition={{ duration: 0.6 }}
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.9 }}
        aria-label="Open reward chest"
      >
        <Decor name="backpack" size={28} />
        {rewards.length > 0 && (
          <motion.span
            key={rewards.length}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {rewards.length}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="mx-4 w-full max-w-sm rounded-3xl bg-white p-6"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 flex items-center justify-center gap-2 text-center text-2xl font-black">
                <Decor name="backpack" size={30} /> Your Rewards!
              </h2>

              {rewards.length === 0 ? (
                <p className="text-center text-gray-400">No rewards yet! Keep playing!</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {rewards.map((reward, index) => (
                    <motion.div
                      key={`${reward.id}-${index}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col items-center rounded-2xl bg-gray-50 p-2"
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: index * 0.1 }}
                      >
                        <Picture src={reward.image} alt={reward.name} className="h-20 w-20 object-contain" />
                      </motion.div>
                      <span className="mt-1 text-xs font-bold text-gray-500">{reward.name}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 py-3 text-lg font-bold"
              >
                Keep Playing! <Decor name="controller" size={26} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})
