import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurriculumForClass } from "@/lib/curriculum"
import { allLetterImages } from "@/data/letterImages"
import { DiscoverAllRunner } from "@/components/discover/DiscoverAllRunner"
import { completeWordJourney } from "@/app/student/discover/actions"

// Word Journey — one continuous gallery of EVERY picture for the class's
// curriculum letters, toured one at a time at the child's own pace. A
// standalone exploration mode (see /student/journey), independent of the
// letters/numbers progression — reachable any time, not gated by level.
export default async function DiscoverPage() {
  const jar = await cookies()
  const classId = jar.get("kinda_class")?.value
  const studentId = jar.get("kinda_student")?.value
  if (!classId || !studentId) redirect("/student/choose")

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student || student.classId !== classId) redirect("/student/choose")

  const { letters } = await getCurriculumForClass(classId)
  const images = allLetterImages(letters)

  if (images.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-2xl font-black text-gray-500">
        Nothing to see here yet
      </div>
    )
  }

  return <DiscoverAllRunner images={images} onFinish={completeWordJourney} />
}
