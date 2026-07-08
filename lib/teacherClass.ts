import { cookies } from "next/headers"
import type { Session } from "next-auth"
import { prisma } from "./prisma"

// Where-clause scoping classes to the signed-in teacher (own classes only). The
// platform super-admin has no school and does NOT teach — they manage via
// /admin — so an admin without a school matches no classes here.
function scope(session: Session) {
  if (session.user.role === "TEACHER") return { teacherId: session.user.id }
  return { schoolId: session.user.schoolId ?? "__no_school__" }
}

/** All of the teacher's/admin's classes (active by default). */
export async function listTeacherClasses(session: Session, opts: { includeArchived?: boolean } = {}) {
  const where = opts.includeArchived ? scope(session) : { ...scope(session), archived: false }
  return prisma.class.findMany({ where, orderBy: { createdAt: "asc" } })
}

/** Active classes with student counts — just enough to power the ClassSwitcher. */
export async function listActiveClassOptions(session: Session) {
  const classes = await prisma.class.findMany({
    where: { ...scope(session), archived: false },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { students: true } } },
  })
  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    year: c.year,
    term: c.term,
    students: c._count.students,
  }))
}

/**
 * Which active class the teacher is currently working in. Uses the
 * `kinda_active_class` cookie when it points at one of their active classes,
 * else falls back to their first active class. Returns null if they have none.
 */
export async function resolveActiveClassId(session: Session): Promise<string | null> {
  const classes = await listTeacherClasses(session)
  if (classes.length === 0) return null
  const cookieId = (await cookies()).get("kinda_active_class")?.value
  if (cookieId && classes.some((c) => c.id === cookieId)) return cookieId
  return classes[0].id
}
