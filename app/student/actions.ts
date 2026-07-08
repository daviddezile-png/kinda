"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

const YEAR = 60 * 60 * 24 * 365

// A student "logs in" simply by being picked from the class grid (spec 09 —
// young children don't type passwords). We remember the choice in a 1-year
// cookie so the app re-opens straight to this child (WhatsApp-style). The lesson
// language is taken from the school setting — the child never chooses it.
export async function chooseStudent(classId: string, studentId: string) {
  const c = await cookies()
  // The device must be bound to THIS class via its join code, and the child must
  // actually belong to it — so no device can pick another class's/school's
  // student by passing arbitrary ids.
  const joinId = c.get("kinda_join")?.value
  if (!joinId || joinId !== classId) redirect("/student/join")

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
    include: { class: { include: { school: true } } },
  })
  if (!student) redirect("/student/join")

  c.set("kinda_class", classId, { maxAge: YEAR, path: "/" })
  c.set("kinda_student", studentId, { maxAge: YEAR, path: "/" })
  const lang = student.class.school.language === "SWAHILI" ? "sw" : "en"
  c.set("lang", lang, { maxAge: YEAR, path: "/" })

  redirect("/student")
}

export async function leaveStudent() {
  const c = await cookies()
  c.delete("kinda_class")
  c.delete("kinda_student")
  redirect("/student/choose")
}
