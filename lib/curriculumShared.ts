// Client-safe curriculum constants & types (no server/Node imports). Both the
// server module (lib/curriculum.ts) and client components import from here.

export interface CurriculumConfig {
  letters: string[] // uppercase, order matters
  steps: number[] // enabled steps among 0..4, ascending
  numbers: number[] // enabled numbers among 1..10, ascending (the MATH module)
  sequential: boolean
}

// Learning stages (also used as a student's per-account "level") for the
// ABC/numbers PROGRESSION only. "See & Know" is no longer level 0 inside this
// progression — it's a separate, standalone "Journey" a child can explore any
// time (see /student/journey), independent of the teacher's curriculum and of
// student.level. Letters/numbers always start at level 1 and a student stays
// on one level until the teacher raises it.
export const ALL_STEPS = [1, 2, 3, 4]

// The Numbers & Counting module covers 1–10. The teacher picks which of these a
// class works through (see data/numbers.ts for the lesson content).
export const ALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const STEP_LABELS: Record<number, string> = {
  1: "See & Listen",
  2: "Recognize",
  3: "Write",
  4: "Games",
}

/** Clamp any value to a valid level (1–4 — level 0 is retired from the
 *  progression; see the ALL_STEPS note above). */
export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1
  return Math.max(1, Math.min(4, Math.trunc(level)))
}

/** Lowest enabled step — where a letter's lesson should start. */
export function firstEnabledStep(steps: number[]): number {
  return [...steps].sort((a, b) => a - b)[0] ?? 1
}
