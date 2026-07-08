import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { animalJourneyFrames } from "@/data/animals"
import { DiscoverAllRunner } from "@/components/discover/DiscoverAllRunner"
import { completeAnimalJourney } from "@/app/student/journey/actions"

// Animal Journey — one continuous gallery of EVERY animal we have art for (not
// gated by the teacher's curriculum — the child meets every animal), toured
// one at a time at the child's own pace. Reuses the same voice-first gallery
// as the Word Journey (components/discover/DiscoverGallery).
export default async function AnimalJourneyPage() {
  const jar = await cookies()
  const classId = jar.get("kinda_class")?.value
  const studentId = jar.get("kinda_student")?.value
  if (!classId || !studentId) redirect("/student/choose")

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student || student.classId !== classId) redirect("/student/choose")

  const images = animalJourneyFrames()

  return <DiscoverAllRunner images={images} onFinish={completeAnimalJourney} redirectTo="/student/journey" />
}
