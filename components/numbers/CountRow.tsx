"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Decor } from "@/components/ui/Decor"
import type { CountObject } from "@/data/numbers"

interface CountRowProps {
  object: CountObject
  count: number
  /** Indexes the child has counted, in the ORDER they tapped them — the badge
   *  on each item shows its position in that order ("1", "2", "3"…). */
  lit: readonly number[]
  onTap?: (index: number) => void
  /** Item box in px. */
  size?: number
  /** Show the running count number on each counted item. */
  showBadges?: boolean
}

// A wrap-row of identical tappable objects — the heart of every counting
// interaction. Decor objects render as transparent art; photo objects as
// rounded real photos (the child counts things they already know by name).
export function CountRow({ object, count, lit, onTap, size = 96, showBadges = true }: CountRowProps) {
  return (
    <div className="flex max-w-3xl flex-wrap items-center justify-center gap-3 sm:gap-4">
      {Array.from({ length: count }, (_, i) => {
        const litPos = lit.indexOf(i)
        const isLit = litPos !== -1
        return (
          <motion.button
            key={i}
            type="button"
            onClick={() => onTap?.(i)}
            disabled={!onTap || isLit}
            aria-label={`${object.name} ${i + 1} of ${count}${isLit ? ", counted" : ""}`}
            initial={{ opacity: 0, scale: 0.4, y: 24 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: isLit ? [1, 1.25, 1.08] : 1,
            }}
            transition={{
              delay: i * 0.08,
              type: "spring",
              stiffness: 300,
              damping: 18,
              // The counted pop is 3 keyframes — springs only support 2, so
              // scale gets its own tween (framer throws otherwise).
              scale: { type: "tween", duration: 0.35, ease: "easeOut" },
            }}
            whileTap={!isLit && onTap ? { scale: 0.9 } : {}}
            className="relative grid place-items-center rounded-3xl transition-all"
            style={{
              width: size,
              height: size,
              filter: isLit ? "none" : onTap ? "saturate(0.75)" : "none",
            }}
          >
            {isLit && (
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-yellow-200/70 blur-xl"
              />
            )}
            {object.decor ? (
              <Decor name={object.decor} size={size * 0.9} />
            ) : (
              // The counting objects are transparent cut-outs (images/things),
              // so contain them whole — no crop, no card frame.
              <Image
                src={object.image ?? ""}
                alt={object.name}
                width={size}
                height={size}
                className="pointer-events-none h-full w-full select-none object-contain drop-shadow-md"
                draggable={false}
              />
            )}
            {showBadges && isLit && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full bg-[#40C057] text-base font-black text-white shadow-md"
              >
                {litPos + 1}
              </motion.span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
