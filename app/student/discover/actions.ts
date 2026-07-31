"use server"

import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getCurriculumForClass } from "@/lib/curriculum"
import { discoverItems } from "@/data/discover"

// The Word Journey — every "See & Know" picture, toured in one sitting — is a
// standalone exploration mode, independent of the letters/numbers PROGRESSION
// (student.level, which now always starts at 1). Finishing it records one
// Progress row per item under the READING module (not LETTERS), so it never
// mixes into the teacher's letters-progress analytics, and it does NOT touch
// student.level — the child can revisit this Journey any time.
export async function completeWordJourney() {
  const jar = await cookies()
  const studentId = jar.get("kinda_student")?.value
  const classId = jar.get("kinda_class")?.value
  if (!studentId || !classId) return

  const { letters } = await getCurriculumForClass(classId)
  const items = discoverItems(letters)
  const now = new Date()

  await Promise.all(
    items.map((item: { letter: string }) =>
      prisma.progress.upsert({
        where: {
          studentId_module_itemId_step: { studentId, module: "READING", itemId: item.letter, step: 0 },
        },
        update: { completed: true, completedAt: now, stars: 1, attempts: { increment: 1 } },
        create: {
          studentId,
          module: "READING",
          itemId: item.letter,
          step: 0,
          completed: true,
          completedAt: now,
          stars: 1,
          attempts: 1,
        },
      }),
    ),
  )
}
