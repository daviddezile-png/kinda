import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveActiveClassId } from "@/lib/teacherClass"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { ClassManager, type ClassRow } from "@/components/teacher/ClassManager"

// Teacher-only: create classes (new year/term), archive/restore them, and choose
// which active class to work in (control two classes).
export default async function TeacherClassesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/login")

  const scope =
    session.user.role === "TEACHER"
      ? { teacherId: session.user.id }
      : { schoolId: session.user.schoolId ?? "__no_school__" }

  const classes = await prisma.class.findMany({
    where: scope,
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { students: true } } },
  })
  const activeClassId = await resolveActiveClassId(session)

  const rows: ClassRow[] = classes.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    year: c.year,
    term: c.term,
    students: c._count.students,
    archived: c.archived,
  }))

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6">
      <PlayfulBackground />
      <div className="relative z-10 mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-700">Classes</h1>
          <Link href="/teacher" className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-500 shadow">
            ← Dashboard
          </Link>
        </header>
        <ClassManager classes={rows} activeClassId={activeClassId} />
      </div>
    </div>
  )
}
