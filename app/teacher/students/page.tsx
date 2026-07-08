import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveActiveClassId, listActiveClassOptions } from "@/lib/teacherClass"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { StudentManager, type RosterStudent } from "@/components/teacher/StudentManager"
import { ClassSwitcher } from "@/components/teacher/ClassSwitcher"

// Teacher-only: register students (name + animal/fruit character) and set each
// child's learning level (the milestone they repeat until the teacher raises it).
export default async function TeacherStudentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/login")

  const [activeClassId, classOptions] = await Promise.all([
    resolveActiveClassId(session),
    listActiveClassOptions(session),
  ])
  const klass = activeClassId
    ? await prisma.class.findUnique({
        where: { id: activeClassId },
        include: { students: { orderBy: { name: "asc" } } },
      })
    : null

  const students: RosterStudent[] = (klass?.students ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    avatar: s.avatar,
    level: s.level,
    module: s.module === "MATH" ? "MATH" : "LETTERS",
  }))

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6">
      <PlayfulBackground />
      <div className="relative z-10 mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-700">Students</h1>
            <p className="text-sm text-gray-400">{klass?.name ?? "No class yet"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/teacher" className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-500 shadow">
              ← Dashboard
            </Link>
            <ClassSwitcher classes={classOptions} activeClassId={activeClassId} />
          </div>
        </header>

        {!klass ? (
          <div className="rounded-3xl bg-white/80 p-8 text-center shadow-lg">
            <p className="text-lg font-bold text-gray-500">No class assigned to you yet.</p>
          </div>
        ) : (
          <StudentManager classId={klass.id} students={students} />
        )}
      </div>
    </div>
  )
}
