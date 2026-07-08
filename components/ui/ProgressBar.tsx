"use client"

import { motion } from "framer-motion"
import { Decor } from "@/components/ui/Decor"

interface ProgressBarProps {
  current: number
  total: number
  step?: number
  totalSteps?: number
}

export function ProgressBar({ current, total, step, totalSteps }: ProgressBarProps) {
  const percent = Math.min(100, Math.round((current / total) * 100))

  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="relative h-5 w-full overflow-hidden rounded-full bg-white/70 shadow-inner ring-1 ring-black/5">
        <motion.div
          className="relative h-full rounded-full bg-linear-to-r from-[#ff6b9d] via-[#ff8a5b] to-[#ffc24a]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <span className="animate-sweep absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/50 to-transparent" />
        </motion.div>
        <motion.span
          className="absolute top-1/2 -translate-y-1/2"
          initial={{ left: 0 }}
          animate={{ left: `calc(${percent}% - 10px)` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <Decor name="star" size={20} />
        </motion.span>
      </div>
      {step && totalSteps && (
        <span className="text-center text-sm font-bold text-gray-500">
          Step {step} of {totalSteps}
        </span>
      )}
    </div>
  )
}
