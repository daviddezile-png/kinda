"use server"

import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { clampLevel } from "@/lib/curriculumShared"

// Record that the logged-in student finished `letter` at `level`. Upserts the
// existing Progress row (unique on studentId+module+itemId+step) so the
// /student/learn runtime can pick the next letter and the teacher's analytics
// reflect it. No-op if no student is remembered on this device.
export async function completeStage(letter: string, level: number) {
  const studentId = (await cookies()).get("kinda_student")?.value
  if (!studentId) return

  const itemId = letter.toUpperCase()
  const step = clampLevel(level)

  await prisma.progress.upsert({
    where: { studentId_module_itemId_step: { studentId, module: "LETTERS", itemId, step } },
    update: { completed: true, completedAt: new Date(), stars: 1, attempts: { increment: 1 } },
    create: {
      studentId,
      module: "LETTERS",
      itemId,
      step,
      completed: true,
      completedAt: new Date(),
      stars: 1,
      attempts: 1,
    },
  })
}
