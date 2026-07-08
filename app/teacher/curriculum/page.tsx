import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurriculumForClass } from "@/lib/curriculum"
import { getAvailableLetters } from "@/lib/letters"
import { resolveActiveClassId, listActiveClassOptions } from "@/lib/teacherClass"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { CurriculumBuilder } from "@/components/teacher/CurriculumBuilder"
import { ClassSwitcher } from "@/components/teacher/ClassSwitcher"

export default async function TeacherCurriculumPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/login")

  const [activeClassId, classOptions] = await Promise.all([
    resolveActiveClassId(session),
    listActiveClassOptions(session),
  ])
  if (!activeClassId) redirect("/teacher")

  const klass = await prisma.class.findUnique({ where: { id: activeClassId } })
  if (!klass) redirect("/teacher")

  const curriculum = await getCurriculumForClass(klass.id)
  const availableLetters = getAvailableLetters().sort()

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6">
      <PlayfulBackground />
      <div className="relative z-10 mx-auto max-w-4xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/teacher" className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-500 shadow">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-700">Curriculum</h1>
              <p className="text-sm text-gray-400">You decide what your class learns and in what order.</p>
            </div>
          </div>
          <ClassSwitcher classes={classOptions} activeClassId={activeClassId} />
        </header>

        <CurriculumBuilder
          className={klass.name}
          availableLetters={availableLetters}
          initial={{ letters: curriculum.letters, steps: curriculum.steps, numbers: curriculum.numbers, sequential: curriculum.sequential }}
        />
      </div>
    </div>
  )
}
