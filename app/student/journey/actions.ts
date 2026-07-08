"use server"

import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { ANIMALS } from "@/data/animals"

// The Animal Journey — every animal we have art for, toured in one sitting —
// is a standalone exploration mode, just like the Word Journey: independent
// of the letters/numbers PROGRESSION and NOT gated by the teacher's
// curriculum (the child meets every animal, not just curriculum letters).
// Finishing it records one Progress row per animal under the READING module,
// distinct itemIds from the Word Journey's (letter-keyed) rows via an
// "animal:" prefix, so the two Journeys never collide in the same
// (studentId, module, itemId, step) slot.
export async function completeAnimalJourney() {
  const studentId = (await cookies()).get("kinda_student")?.value
  if (!studentId) return

  const now = new Date()
  await Promise.all(
    ANIMALS.map((a) =>
      prisma.progress.upsert({
        where: {
          studentId_module_itemId_step: { studentId, module: "READING", itemId: `animal:${a.slug}`, step: 0 },
        },
        update: { completed: true, completedAt: now, stars: 1, attempts: { increment: 1 } },
        create: {
          studentId,
          module: "READING",
          itemId: `animal:${a.slug}`,
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
