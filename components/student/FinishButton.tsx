"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { BigButton } from "@/components/ui/BigButton"
import { completeStage } from "@/app/student/learn/actions"

interface FinishButtonProps {
  letter: string
  level: number
  children?: ReactNode
  /** Accessible label — the button is often icon-only (a star), so screen
   *  readers need a spoken name. */
  ariaLabel?: string
  /** Kept for call-site compatibility. The button already pulses to draw the
   *  eye, so we no longer show a floating pointing-hand sign above it. */
  sign?: boolean
}

// Terminal "Next" for any stage in the teacher-driven flow. Marks the stage
// complete for the current student, then returns to /student/learn, which picks
// the next letter AT THE SAME LEVEL (the child never advances a level themselves).
export function FinishButton({ letter, level, children, ariaLabel }: FinishButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <BigButton
      pulse
      ariaLabel={ariaLabel}
      onClick={() =>
        startTransition(async () => {
          await completeStage(letter, level)
          // Stay in the letters flow (this is the letters "next"), even for a
          // child whose teacher default is MATH but who chose letters today.
          router.push("/student/learn?mode=letters")
        })
      }
    >
      {children ?? "→"}
      {pending ? " …" : ""}
    </BigButton>
  )
}
