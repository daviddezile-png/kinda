"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uniqueClassCode } from "@/lib/classCode"

const YEAR = 60 * 60 * 24 * 365

// Confirm the signed-in teacher/admin may manage this class.
async function assertClassAccess(classId: string) {
  const session = await getServerSession(authOptions)
  if (!session) return null
  const klass = await prisma.class.findUnique({ where: { id: classId } })
  if (!klass) return null
  if (session.user.role === "TEACHER" && klass.teacherId !== session.user.id) return null
  if (klass.schoolId !== session.user.schoolId) return null
  return klass
}

/** Create a class (e.g. for a new year/term) and make it the active one. */
export async function createClass(name: string, year?: string, term?: string) {
  const session = await getServerSession(authOptions)
  if (!session) return
  // Only a school-bound teacher creates classes here; the platform super-admin
  // (no school) manages schools/teachers in /admin, not classes.
  const schoolId = session.user.schoolId
  if (!schoolId) return
  const clean = name.trim()
  if (!clean) return
  const klass = await prisma.class.create({
    data: {
      name: clean,
      code: await uniqueClassCode(),
      year: year?.trim() || null,
      term: term?.trim() || null,
      schoolId,
      teacherId: session.user.role === "TEACHER" ? session.user.id : null,
    },
  })
  ;(await cookies()).set("kinda_active_class", klass.id, { maxAge: YEAR, path: "/" })
  revalidatePath("/teacher/classes")
  revalidatePath("/teacher")
}

/** Archive a class — kept for history/analytics but hidden from active lists. */
export async function archiveClass(classId: string) {
  if (!(await assertClassAccess(classId))) return
  await prisma.class.update({ where: { id: classId }, data: { archived: true } })
  revalidatePath("/teacher/classes")
  revalidatePath("/teacher")
}

/** Bring an archived class back into the active set. */
export async function restoreClass(classId: string) {
  if (!(await assertClassAccess(classId))) return
  await prisma.class.update({ where: { id: classId }, data: { archived: false } })
  revalidatePath("/teacher/classes")
  revalidatePath("/teacher")
}

/** Permanently delete an archived class and everything in it (students,
 *  progress, rewards, curriculum). Only archived classes are deletable — a
 *  teacher must archive first, which keeps this hard-delete from ever hitting
 *  a class children are actively using. */
export async function deleteClass(classId: string) {
  const klass = await assertClassAccess(classId)
  if (!klass || !klass.archived) return

  const students = await prisma.student.findMany({ where: { classId }, select: { id: true } })
  const studentIds = students.map((student: { id: string }) => student.id)

  await prisma.$transaction([
    prisma.progress.deleteMany({ where: { studentId: { in: studentIds } } }),
    prisma.studentReward.deleteMany({ where: { studentId: { in: studentIds } } }),
    prisma.student.deleteMany({ where: { classId } }),
    // Curriculum cascades automatically (onDelete: Cascade in schema).
    prisma.class.delete({ where: { id: classId } }),
  ])

  revalidatePath("/teacher/classes")
  revalidatePath("/teacher")
}

/** Switch which active class the teacher is working in (two-class control). */
export async function setActiveClass(classId: string) {
  if (!(await assertClassAccess(classId))) return
  ;(await cookies()).set("kinda_active_class", classId, { maxAge: YEAR, path: "/" })
  revalidatePath("/teacher")
  revalidatePath("/teacher/students")
  revalidatePath("/teacher/classes")
}
