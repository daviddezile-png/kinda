"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { normalizeCode } from "@/lib/classCode"

const YEAR = 60 * 60 * 24 * 365

export interface JoinState {
  error?: string
}

// A student device opens exactly one class by its code. We remember it in the
// `kinda_join` cookie so /student/choose shows ONLY that class's children — a
// device can never browse another school's or class's students.
export async function joinByCode(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const code = normalizeCode(String(formData.get("code") ?? ""))
  if (!code) return { error: "Please enter your class code." }

  const klass = await prisma.class.findUnique({ where: { code } })
  if (!klass || klass.archived) return { error: "That code didn't match a class. Check with your teacher." }

  ;(await cookies()).set("kinda_join", klass.id, { maxAge: YEAR, path: "/" })
  redirect("/student/choose")
}
