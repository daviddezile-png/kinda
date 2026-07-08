"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { clampLevel } from "@/lib/curriculumShared"

// Continue button on the all-letters celebration: move the child up one level
// (the celebration is only reached when every letter at the current level is
// complete) and drop them back into the learning router.
export async function advanceLevel() {
  const studentId = (await cookies()).get("kinda_student")?.value
  if (!studentId) redirect("/student/choose")

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (student && clampLevel(student.level) < 4) {
    await prisma.student.update({
      where: { id: studentId },
      data: { level: clampLevel(student.level) + 1 },
    })
  }
  // The finale is the letters flow — continue in letters at the new level.
  redirect("/student/learn?mode=letters")
}
