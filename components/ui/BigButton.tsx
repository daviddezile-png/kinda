"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BigButtonProps {
  href?: string
  onClick?: () => void
  children: ReactNode
  pulse?: boolean
  className?: string
  /** Accessible label for icon-only buttons (no readable text inside). */
  ariaLabel?: string
}

// Big, juicy, kid-friendly call-to-action with a shine sweep and bounce.
export function BigButton({ href, onClick, children, pulse, className, ariaLabel }: BigButtonProps) {
  const inner = (
    <motion.span
      whileHover={{ scale: 1.06, rotateX: 12, y: -2 }}
      whileTap={{ scale: 0.93, rotateX: -8, y: 2 }}
      animate={pulse ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={
        pulse
          ? { duration: 1.4, repeat: Infinity }
          : { type: "spring", stiffness: 400, damping: 14 }
      }
      style={{ transformPerspective: 600, transformStyle: "preserve-3d" }}
      className={cn(
        "relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-[#ff6b9d] via-[#ff8a5b] to-[#ffc24a] px-10 py-4 text-xl font-bold text-white shadow-[0_14px_30px_-6px_rgba(255,107,157,0.65),inset_0_-4px_0_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <span className="animate-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/50 to-transparent" />
    </motion.span>
  )

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className="inline-block">
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="inline-block">
      {inner}
    </button>
  )
}
