"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clampLevel } from "@/lib/curriculumShared"
import { characterById } from "@/lib/characters"

// Confirm the signed-in teacher/admin may manage this class, returning it or null.
async function assertClassAccess(classId: string) {
  const session = await getServerSession(authOptions)
  if (!session) return null
  const klass = await prisma.class.findUnique({ where: { id: classId } })
  if (!klass) return null
  if (session.user.role === "TEACHER" && klass.teacherId !== session.user.id) return null
  if (klass.schoolId !== session.user.schoolId) return null
  return klass
}

// Confirm access via a student's class.
async function assertStudentAccess(studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) return null
  const klass = await assertClassAccess(student.classId)
  return klass ? student : null
}

/** Register a new student = name + animal/fruit character. Starts at level 1 —
 *  the ABC/numbers progression's floor (see lib/curriculumShared.ts; "See &
 *  Know" is now the separate, always-available Journey, not a level). */
export async function addStudent(classId: string, name: string, characterId: string) {
  if (!(await assertClassAccess(classId))) return
  const clean = name.trim()
  if (!clean) return
  const avatar = characterById(characterId)?.id ?? null
  await prisma.student.create({ data: { name: clean, avatar, classId, level: 1 } })
  revalidatePath("/teacher/students")
}

/** Set a student's learning level (the milestone they repeat until raised). */
export async function setStudentLevel(studentId: string, level: number) {
  if (!(await assertStudentAccess(studentId))) return
  await prisma.student.update({ where: { id: studentId }, data: { level: clampLevel(level) } })
  revalidatePath("/teacher/students")
}

/** Set what THIS child studies today: letters (ABC) or numbers/counting (123).
 *  The child's big "start" button routes wherever this says — they never pick. */
export async function setStudentModule(studentId: string, module: "LETTERS" | "MATH") {
  if (!(await assertStudentAccess(studentId))) return
  await prisma.student.update({ where: { id: studentId }, data: { module } })
  revalidatePath("/teacher/students")
}

/** Remove a student and their progress/rewards. */
export async function removeStudent(studentId: string) {
  if (!(await assertStudentAccess(studentId))) return
  await prisma.$transaction([
    prisma.progress.deleteMany({ where: { studentId } }),
    prisma.studentReward.deleteMany({ where: { studentId } }),
    prisma.student.delete({ where: { id: studentId } }),
  ])
  revalidatePath("/teacher/students")
}
