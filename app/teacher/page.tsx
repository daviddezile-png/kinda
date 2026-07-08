import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurriculumForClass, STEP_LABELS } from "@/lib/curriculum"
import { ALL_STEPS, clampLevel } from "@/lib/curriculumShared"
import { resolveActiveClassId, listActiveClassOptions } from "@/lib/teacherClass"
import { getClassAnalytics } from "@/lib/analytics"
import { characterById } from "@/lib/characters"
import { firstName, timeGreeting } from "@/lib/greeting"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { Picture } from "@/components/ui/Picture"
import { LogoutButton } from "@/components/teacher/LogoutButton"
import { ClassSwitcher } from "@/components/teacher/ClassSwitcher"

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/login")
  // The platform super-admin has no class/school — send them to their console.
  if (session.user.role === "ADMIN") redirect("/admin")

  const [activeClassId, classOptions] = await Promise.all([
    resolveActiveClassId(session),
    listActiveClassOptions(session),
  ])
  const klass = activeClassId
    ? await prisma.class.findUnique({ where: { id: activeClassId }, include: { students: true } })
    : null

  const curriculum = klass ? await getCurriculumForClass(klass.id) : null

  // Class-wide analytics from the Progress rows the runtime writes.
  const studentIds = klass?.students.map((s) => s.id) ?? []
  const agg = studentIds.length
    ? await prisma.progress.aggregate({
        where: { studentId: { in: studentIds }, completed: true },
        _sum: { stars: true },
        _count: { _all: true },
      })
    : null
  const stagesDone = agg?._count._all ?? 0
  const starsTotal = agg?._sum.stars ?? 0
  const levelCounts = ALL_STEPS.map(
    (lvl) => klass?.students.filter((s) => clampLevel(s.level) === lvl).length ?? 0,
  )
  const maxLevelCount = Math.max(1, ...levelCounts)

  // Per-student "needs support" picture so the teacher can see, at a glance,
  // which children to help and how the class as a whole is doing.
  const analytics = await getClassAnalytics(studentIds)
  const nameById = new Map(klass?.students.map((s) => [s.id, s]) ?? [])

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6">
      <PlayfulBackground />
      <div className="relative z-10 mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-700">
              {timeGreeting()}, {firstName(session.user.name)}!
            </h1>
            <p className="text-sm text-gray-400">{session.user.schoolName}</p>
          </div>
          <div className="flex items-center gap-2">
            <ClassSwitcher classes={classOptions} activeClassId={activeClassId} />
            <LogoutButton />
          </div>
        </header>

        {!klass ? (
          <div className="rounded-3xl bg-white/80 p-8 text-center shadow-lg">
            <p className="text-lg font-bold text-gray-500">No class assigned to you yet.</p>
            <p className="text-sm text-gray-400">Ask your admin to assign you a class.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-white/80 p-5 shadow-lg md:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Class</p>
              <p className="text-xl font-black text-gray-700">{klass.name}</p>
              <p className="mt-1 text-3xl font-black text-pink-500">{klass.students.length}</p>
              <p className="text-sm text-gray-400">students</p>
            </div>

            <div className="rounded-3xl bg-white/80 p-5 shadow-lg md:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Current curriculum</p>
                <Link
                  href="/teacher/curriculum"
                  className="rounded-full bg-indigo-500 px-4 py-1.5 text-sm font-bold text-white shadow"
                >
                  Edit
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-bold">{curriculum?.letters.length}</span> letters ·{" "}
                {curriculum?.sequential ? "in order" : "any order"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {curriculum?.letters.map((l) => (
                  <span key={l} className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100 text-sm font-black text-gray-600">
                    {l}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {curriculum?.steps.map((s) => (
                  <span key={s} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-500">
                    {STEP_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 p-5 shadow-lg md:col-span-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Class progress</p>
              <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex gap-6">
                  <div>
                    <p className="text-3xl font-black text-green-500">{stagesDone}</p>
                    <p className="text-xs text-gray-400">stages done</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-amber-500">{starsTotal}</p>
                    <p className="text-xs text-gray-400">stars</p>
                  </div>
                </div>
                {/* Level distribution: how many children sit on each stage */}
                <div className="flex items-end gap-2">
                  {ALL_STEPS.map((lvl, idx) => (
                    <div key={lvl} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-xs font-bold text-gray-500">{levelCounts[idx]}</span>
                      <div className="flex h-20 w-full items-end rounded-lg bg-gray-50">
                        <div
                          className="w-full rounded-lg bg-linear-to-t from-indigo-500 to-indigo-300"
                          style={{ height: `${(levelCounts[idx] / maxLevelCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-center text-[10px] font-bold text-gray-400">Lv{lvl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Needs more support: children the data flags for extra help. */}
            <div className="rounded-3xl bg-white/80 p-5 shadow-lg md:col-span-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                Needs more support
              </p>
              {analytics.totalStudents === 0 ? (
                <p className="py-2 text-sm font-bold text-gray-400">
                  No children registered in this class yet.
                </p>
              ) : analytics.needSupport.length === 0 ? (
                <p className="py-2 text-sm font-bold text-green-500">
                  Everyone is keeping up — no child is flagged right now.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {analytics.needSupport.map((sup) => {
                    const s = nameById.get(sup.studentId)
                    if (!s) return null
                    const ch = characterById(s.avatar)
                    return (
                      <Link
                        key={sup.studentId}
                        href={`/teacher/students/${sup.studentId}`}
                        className="flex items-start gap-3 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200 transition hover:ring-amber-400"
                      >
                        <Picture src={ch?.image} alt={ch?.label ?? s.name} emoji={ch?.emoji} emojiClassName="text-2xl" className="h-9 w-9 shrink-0 object-contain" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-700">{s.name}</p>
                          <ul className="mt-0.5 space-y-0.5">
                            {sup.reasons.map((r) => (
                              <li key={r} className="text-xs font-bold text-amber-600">
                                • {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
              {analytics.totalStudents > 0 && (
                <p className="mt-3 text-xs text-gray-400">
                  Class average: {analytics.avgCompleted.toFixed(1)} stages done ·{" "}
                  {analytics.started}/{analytics.totalStudents} children started
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-white/80 p-5 shadow-lg md:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Students</p>
                <Link
                  href="/teacher/students"
                  className="rounded-full bg-indigo-500 px-4 py-1.5 text-sm font-bold text-white shadow"
                >
                  Register & levels
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {klass.students.map((s) => {
                  const ch = characterById(s.avatar)
                  const level = clampLevel(s.level)
                  const sup = analytics.byStudent.get(s.id)
                  const dot =
                    sup?.level === "support"
                      ? "bg-amber-400"
                      : sup?.level === "good"
                        ? "bg-green-400"
                        : "bg-gray-300"
                  return (
                    <Link
                      key={s.id}
                      href={`/teacher/students/${s.id}`}
                      className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 transition hover:bg-indigo-50"
                    >
                      <span className="relative shrink-0">
                        <Picture src={ch?.image} alt={ch?.label ?? s.name} emoji={ch?.emoji} emojiClassName="text-2xl" className="h-9 w-9 object-contain" />
                        <span
                          title={sup?.needsSupport ? "Needs support" : "On track"}
                          className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ring-2 ring-white ${dot}`}
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-700">{s.name}</p>
                        <p className="text-xs text-gray-400">Lv {level} · {STEP_LABELS[level]}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
