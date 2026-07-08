import { prisma } from "./prisma"
import { getAvailableLetters } from "./letters"
import { ALL_STEPS, ALL_NUMBERS, type CurriculumConfig } from "./curriculumShared"

// Re-export the client-safe pieces so server callers can import everything from
// "@/lib/curriculum" as before.
export { ALL_STEPS, ALL_NUMBERS, STEP_LABELS, firstEnabledStep } from "./curriculumShared"
export type { CurriculumConfig } from "./curriculumShared"

/** The arrangement used before a teacher customises anything: every letter that
 *  has content, A→Z, all four steps, every number 1–10, free (non-sequential)
 *  order. */
export function defaultCurriculum(): CurriculumConfig {
  return {
    letters: getAvailableLetters().sort(),
    steps: [...ALL_STEPS],
    numbers: [...ALL_NUMBERS],
    sequential: false,
  }
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
}
function asNumberArray(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : []
}

/** Resolve the effective curriculum for a class (falls back to the default). */
export async function getCurriculumForClass(classId: string): Promise<CurriculumConfig> {
  const c = await prisma.curriculum.findUnique({ where: { classId } })
  const fallback = defaultCurriculum()
  if (!c) return fallback

  const letters = asStringArray(c.letters).map((l) => l.toUpperCase())
  const steps = asNumberArray(c.steps).filter((s) => ALL_STEPS.includes(s)).sort((a, b) => a - b)
  const numbers = asNumberArray(c.numbers).filter((n) => ALL_NUMBERS.includes(n)).sort((a, b) => a - b)
  return {
    letters: letters.length ? letters : fallback.letters,
    steps: steps.length ? steps : [...ALL_STEPS],
    numbers: numbers.length ? numbers : [...ALL_NUMBERS],
    sequential: c.sequential,
  }
}
