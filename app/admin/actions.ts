"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/admin"

export interface ActionState {
  ok?: boolean
  error?: string
}

const emailOf = (v: FormDataEntryValue | null) => String(v ?? "").trim().toLowerCase()
const textOf = (v: FormDataEntryValue | null) => String(v ?? "").trim()

/** Create a school (super-admin only). */
export async function createSchool(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getAdminSession())) return { error: "Not allowed." }
  const name = textOf(formData.get("name"))
  const email = emailOf(formData.get("email"))
  const phone = textOf(formData.get("phone")) || null
  if (!name || !email) return { error: "School name and email are required." }
  if (await prisma.school.findUnique({ where: { email } }))
    return { error: "A school with that email already exists." }

  await prisma.school.create({ data: { name, email, phone } })
  revalidatePath("/admin")
  return { ok: true }
}

/** Create a teacher account linked to a school (super-admin only). */
export async function createTeacher(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getAdminSession())) return { error: "Not allowed." }
  const name = textOf(formData.get("name"))
  const email = emailOf(formData.get("email"))
  const password = String(formData.get("password") ?? "")
  const schoolId = textOf(formData.get("schoolId"))
  if (!name || !email || !password || !schoolId)
    return { error: "Name, email, password and school are all required." }
  if (password.length < 6) return { error: "Password must be at least 6 characters." }
  if (await prisma.user.findUnique({ where: { email } }))
    return { error: "An account with that email already exists." }
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) return { error: "That school no longer exists." }

  const hash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hash, role: "TEACHER", schoolId },
  })
  revalidatePath("/admin")
  return { ok: true }
}

/** Suspend or re-enable a teacher's login (super-admin only). Never touches
 *  admin accounts. */
export async function setTeacherActive(userId: string, active: boolean) {
  if (!(await getAdminSession())) return
  await prisma.user.updateMany({
    where: { id: userId, role: "TEACHER" },
    data: { isActive: active },
  })
  revalidatePath("/admin")
}

/** The super-admin changes their OWN password — requires the current password
 *  as proof, same as any account-security-sensitive change. */
export async function changeOwnPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getAdminSession()
  if (!session) return { error: "Not allowed." }
  const current = String(formData.get("currentPassword") ?? "")
  const next = String(formData.get("newPassword") ?? "")
  if (!current || !next) return { error: "Both current and new password are required." }
  if (next.length < 6) return { error: "New password must be at least 6 characters." }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: "Account not found." }
  const valid = await bcrypt.compare(current, user.password)
  if (!valid) return { error: "Current password is incorrect." }

  const hash = await bcrypt.hash(next, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } })
  return { ok: true }
}

/** The super-admin sets a NEW password for any teacher (no current-password
 *  check — admin authority substitutes for it, same as resetting a forgotten
 *  password over the phone). */
export async function setTeacherPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getAdminSession())) return { error: "Not allowed." }
  const userId = textOf(formData.get("userId"))
  const next = String(formData.get("newPassword") ?? "")
  if (!userId || !next) return { error: "A new password is required." }
  if (next.length < 6) return { error: "New password must be at least 6 characters." }

  const hash = await bcrypt.hash(next, 10)
  const result = await prisma.user.updateMany({
    where: { id: userId, role: "TEACHER" },
    data: { password: hash },
  })
  if (result.count === 0) return { error: "That teacher no longer exists." }
  return { ok: true }
}
