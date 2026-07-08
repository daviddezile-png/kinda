import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { characterById, DEFAULT_CHARACTER } from "@/lib/characters"
import { CelebrateAll } from "@/components/student/CelebrateAll"

// Shown once the child has finished EVERY letter at their level: the teacher
// and the child's own character celebrate together, with claps and concluding
// voice lines. Continue advances the level (see actions.ts).
export default async function CelebratePage() {
  const jar = await cookies()
  const studentId = jar.get("kinda_student")?.value
  if (!studentId) redirect("/student/choose")

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) redirect("/student/choose")

  const character = characterById(student.avatar) ?? DEFAULT_CHARACTER

  return (
    <CelebrateAll
      studentName={student.name}
      avatarImage={character.image}
      avatarLabel={character.label}
    />
  )
}
