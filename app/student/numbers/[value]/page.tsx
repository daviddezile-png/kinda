import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { numberByValue } from "@/data/numbers"
import { getCurriculumForClass, defaultCurriculum } from "@/lib/curriculum"
import { NumberLessonClient } from "@/components/numbers/NumberLessonClient"

interface NumberPageProps {
  params: Promise<{ value: string }>
}

// One number's full lesson (teach → count-along → word → six games). The number
// must be one the teacher assigned to this class, so a child can't reach a
// number outside their curriculum by URL.
export default async function NumberPage({ params }: NumberPageProps) {
  const { value } = await params
  const data = numberByValue(Number(value))
  if (!data) redirect("/student/numbers")

  const classId = (await cookies()).get("kinda_class")?.value
  const curriculum = classId ? await getCurriculumForClass(classId) : defaultCurriculum()
  if (!curriculum.numbers.includes(data.value)) redirect("/student/numbers")

  return <NumberLessonClient data={data} />
}
