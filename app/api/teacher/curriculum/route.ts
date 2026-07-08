import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ALL_STEPS, ALL_NUMBERS, getCurriculumForClass } from "@/lib/curriculum"
import { getAvailableLetters } from "@/lib/letters"

async function resolveTeacherClass(userId: string, role: string, schoolId: string | null) {
  const where =
    role === "TEACHER" ? { teacherId: userId } : { schoolId: schoolId ?? "__no_school__" }
  return prisma.class.findFirst({ where, orderBy: { createdAt: "asc" } })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const klass = await resolveTeacherClass(session.user.id, session.user.role, session.user.schoolId)
  if (!klass) return NextResponse.json({ error: "No class assigned" }, { status: 404 })

  const curriculum = await getCurriculumForClass(klass.id)
  return NextResponse.json({
    class: { id: klass.id, name: klass.name },
    curriculum,
    availableLetters: getAvailableLetters().sort(),
  })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const klass = await resolveTeacherClass(session.user.id, session.user.role, session.user.schoolId)
  if (!klass) return NextResponse.json({ error: "No class assigned" }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 })

  const allowed = new Set(getAvailableLetters().map((l) => l.toUpperCase()))
  const letters: string[] = Array.isArray(body.letters)
    ? body.letters.map((l: unknown) => String(l).toUpperCase()).filter((l: string) => allowed.has(l))
    : []
  const rawSteps: number[] = Array.isArray(body.steps) ? body.steps.map((s: unknown) => Number(s)) : []
  const steps: number[] = [...new Set(rawSteps)].filter((s) => ALL_STEPS.includes(s)).sort((a, b) => a - b)
  const rawNumbers: number[] = Array.isArray(body.numbers) ? body.numbers.map((n: unknown) => Number(n)) : []
  const numbers: number[] = [...new Set(rawNumbers)].filter((n) => ALL_NUMBERS.includes(n)).sort((a, b) => a - b)
  const sequential = Boolean(body.sequential)

  if (!letters.length) return NextResponse.json({ error: "Pick at least one letter" }, { status: 400 })
  if (!steps.length) return NextResponse.json({ error: "Pick at least one step" }, { status: 400 })
  if (!numbers.length) return NextResponse.json({ error: "Pick at least one number" }, { status: 400 })

  await prisma.curriculum.upsert({
    where: { classId: klass.id },
    update: { letters, steps, numbers, sequential },
    create: { classId: klass.id, module: "LETTERS", letters, steps, numbers, sequential },
  })

  return NextResponse.json({ ok: true })
}
