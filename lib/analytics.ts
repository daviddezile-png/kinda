import { prisma } from "@/lib/prisma"

// Server-only. Turns the raw Progress rows the learning runtime writes into the
// "who needs more support?" picture the teacher dashboard and the per-student
// page show. Keep all the support heuristics here so both views agree.

const STALE_DAYS = 7 // no completed stage in this many days → drifting
const REPEAT_LIMIT = 3 // redoing stages this many extra times → struggling
const BEHIND_RATIO = 0.5 // fewer than half the class average → falling behind

export type SupportLevel = "good" | "ok" | "support"

export interface StudentSupport {
  studentId: string
  completed: number // distinct stages finished
  stars: number
  attempts: number // total completeStage calls across all stages
  retries: number // attempts beyond the first pass of each stage
  lastActive: Date | null
  daysSinceActive: number | null
  level: SupportLevel
  needsSupport: boolean
  /** Plain-language reasons, e.g. "Falling behind the class". */
  reasons: string[]
}

export interface ClassAnalytics {
  byStudent: Map<string, StudentSupport>
  totalStudents: number
  started: number // children who have completed at least one stage
  avgCompleted: number // mean stages done across the class
  /** Children flagged for support, most in need first. */
  needSupport: StudentSupport[]
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000)
}

// Pure scoring so it can be reasoned about (and unit-tested) without the DB.
export function scoreStudent(
  studentId: string,
  rows: { completed: boolean; stars: number; attempts: number; completedAt: Date | null }[],
  classAvgCompleted: number,
  classHasActivity: boolean,
  now: Date,
): StudentSupport {
  const completed = rows.filter((r) => r.completed).length
  const stars = rows.reduce((n, r) => n + r.stars, 0)
  const attempts = rows.reduce((n, r) => n + r.attempts, 0)
  const retries = rows.reduce((n, r) => n + Math.max(0, r.attempts - 1), 0)
  const lastActive = rows.reduce<Date | null>(
    (latest, r) => (r.completedAt && (!latest || r.completedAt > latest) ? r.completedAt : latest),
    null,
  )
  const daysSinceActive = lastActive ? daysBetween(lastActive, now) : null

  const reasons: string[] = []
  // Only flag "hasn't started" once SOMEONE in the class is moving — a brand-new
  // class shouldn't light up entirely red on day one.
  if (completed === 0 && classHasActivity) {
    reasons.push("Hasn't started yet")
  } else if (completed > 0 && classAvgCompleted > 1 && completed < classAvgCompleted * BEHIND_RATIO) {
    reasons.push("Falling behind the class")
  }
  if (retries >= REPEAT_LIMIT) {
    reasons.push("Repeating stages a lot")
  }
  if (daysSinceActive !== null && daysSinceActive >= STALE_DAYS) {
    reasons.push(`Quiet for ${daysSinceActive} days`)
  }

  const needsSupport = reasons.length > 0
  const level: SupportLevel = needsSupport
    ? "support"
    : completed >= classAvgCompleted && (daysSinceActive === null || daysSinceActive < STALE_DAYS)
      ? "good"
      : "ok"

  return {
    studentId,
    completed,
    stars,
    attempts,
    retries,
    lastActive,
    daysSinceActive,
    level,
    needsSupport,
    reasons,
  }
}

// One query for the whole class, then score each child against the class average.
export async function getClassAnalytics(
  studentIds: string[],
  now: Date = new Date(),
): Promise<ClassAnalytics> {
  const empty: ClassAnalytics = {
    byStudent: new Map(),
    totalStudents: 0,
    started: 0,
    avgCompleted: 0,
    needSupport: [],
  }
  if (studentIds.length === 0) return empty

  const rows = await prisma.progress.findMany({
    where: { studentId: { in: studentIds }, module: "LETTERS" },
    select: { studentId: true, completed: true, stars: true, attempts: true, completedAt: true },
  })

  const byId = new Map<string, typeof rows>()
  for (const id of studentIds) byId.set(id, [])
  for (const r of rows) byId.get(r.studentId)?.push(r)

  const completedPerStudent = studentIds.map(
    (id) => byId.get(id)!.filter((r) => r.completed).length,
  )
  const started = completedPerStudent.filter((n) => n > 0).length
  const avgCompleted =
    completedPerStudent.reduce((a, b) => a + b, 0) / studentIds.length || 0
  const classHasActivity = started > 0

  const byStudent = new Map<string, StudentSupport>()
  for (const id of studentIds) {
    byStudent.set(id, scoreStudent(id, byId.get(id)!, avgCompleted, classHasActivity, now))
  }

  const needSupport = [...byStudent.values()]
    .filter((s) => s.needsSupport)
    // Surface the most concerning first: fewest stages done, then most reasons.
    .sort((a, b) => a.completed - b.completed || b.reasons.length - a.reasons.length)

  return {
    byStudent,
    totalStudents: studentIds.length,
    started,
    avgCompleted,
    needSupport,
  }
}
