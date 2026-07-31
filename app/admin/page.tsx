import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin"
import { setTeacherActive } from "@/app/admin/actions"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { CreateSchoolForm } from "@/components/admin/CreateSchoolForm"
import { CreateTeacherForm } from "@/components/admin/CreateTeacherForm"
import { ChangeOwnPasswordForm } from "@/components/admin/ChangeOwnPasswordForm"
import { TeacherPasswordReset } from "@/components/admin/TeacherPasswordReset"
import { LogoutButton } from "@/components/teacher/LogoutButton"

// The platform super-admin console: create/see every school and teacher. Schools
// and teachers never see each other — only this page sees them all.
export const dynamic = "force-dynamic"

interface AdminSchool {
  id: string
  name: string
  email: string
  _count: {
    users: number
    classes: number
  }
}

interface AdminTeacher {
  id: string
  name: string | null
  email: string | null
  isActive: boolean
  school: {
    name: string
  } | null
}

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) redirect("/auth/login")

  const [schools, teachers] = (await Promise.all([
    prisma.school.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { users: true, classes: true } } },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { createdAt: "asc" },
      include: { school: { select: { name: true } } },
    }),
  ])) as [AdminSchool[], AdminTeacher[]]

  const schoolOptions = schools.map((s) => ({ id: s.id, name: s.name }))
  const card = "rounded-3xl bg-white/85 p-5 shadow-lg"

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6">
      <PlayfulBackground />
      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-700">Admin console</h1>
            <p className="text-sm text-gray-400">
              {session.user.name} · {schools.length} schools · {teachers.length} teachers
            </p>
          </div>
          <LogoutButton />
        </header>

        {/* My account */}
        <section className={card}>
          <h2 className="mb-3 text-lg font-black text-gray-700">My account</h2>
          <ChangeOwnPasswordForm />
        </section>

        {/* Schools */}
        <section className={card}>
          <h2 className="mb-3 text-lg font-black text-gray-700">Schools</h2>
          <CreateSchoolForm />
          <ul className="mt-4 divide-y divide-gray-100">
            {schools.length === 0 && <li className="py-4 text-sm text-gray-400">No schools yet.</li>}
            {schools.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold text-gray-700">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                </div>
                <p className="shrink-0 text-xs font-bold text-gray-400">
                  {s._count.users} teachers · {s._count.classes} classes
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Teachers */}
        <section className={card}>
          <h2 className="mb-3 text-lg font-black text-gray-700">Teachers</h2>
          <CreateTeacherForm schools={schoolOptions} />
          <ul className="mt-4 divide-y divide-gray-100">
            {teachers.length === 0 && <li className="py-4 text-sm text-gray-400">No teachers yet.</li>}
            {teachers.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-700">
                    {t.name}
                    {!t.isActive && <span className="ml-2 text-xs font-bold text-rose-500">suspended</span>}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {t.email} · {t.school?.name ?? "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TeacherPasswordReset userId={t.id} />
                  <form action={setTeacherActive.bind(null, t.id, !t.isActive)}>
                    <button
                      type="submit"
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold shadow ${
                        t.isActive ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {t.isActive ? "Suspend" : "Activate"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
