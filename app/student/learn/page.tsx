import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurriculumForClass } from "@/lib/curriculum"
import { clampLevel } from "@/lib/curriculumShared"

// The daily-learning router. The child reaches here from the /student world
// picker with `?mode=letters|numbers` (their own choice). We honour that mode;
// with no mode we fall back to the teacher-set `student.module`. Then, for
// letters, we find the next letter not yet finished at the child's level
// (looping to the start when all are done) and send them into that stage. The
// child still never picks WHICH letter, step, or level — only the subject.
export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const jar = await cookies()
  const classId = jar.get("kinda_class")?.value
  const studentId = jar.get("kinda_student")?.value
  if (!classId || !studentId) redirect("/student/choose")

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student || student.classId !== classId) redirect("/student/choose")

  // Numbers world when the child picked it (or, with no explicit pick, when the
  // teacher set this child to MATH). An explicit `mode=letters` always wins.
  const wantsNumbers = mode === "numbers" || (mode !== "letters" && student.module === "MATH")
  if (wantsNumbers) redirect("/student/numbers")

  const level = clampLevel(student.level)
  const curriculum = await getCurriculumForClass(classId)

  const queue = curriculum.letters
  if (queue.length === 0) redirect("/student")

  const done = await prisma.progress.findMany({
    where: { studentId, module: "LETTERS", step: level, completed: true },
    select: { itemId: true, completedAt: true },
  })
  const doneAt = new Map(done.map((d) => [d.itemId, d.completedAt?.getTime() ?? 0]))

  // First unfinished letter. When the whole level is done, repeat — picking the
  // least-recently-practised letter so the child cycles through the full set
  // (never advancing a level on their own; the teacher controls that).
  const unfinished = queue.find((l) => !doneAt.has(l))

  // Child-driven progression: once every letter at this level is finished, the
  // child first gets a big "you learned ALL your letters" celebration (teacher +
  // their own character, claps, voices); its Continue button bumps the level.
  if (!unfinished && level < 4) {
    redirect("/student/celebrate")
  }

  const next =
    unfinished ??
    [...queue].sort((a, b) => (doneAt.get(a) ?? 0) - (doneAt.get(b) ?? 0))[0]

  redirect(`/student/letters/${next.toLowerCase()}/step/${level}`)
}
