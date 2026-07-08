// Seed Kinda with a demo school, admin, teacher, class, students + curriculum.
// Run with:  npm run db:seed   (loads .env via --env-file)
// Idempotent: re-running updates the same demo records.
import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import bcrypt from "bcryptjs"

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL not set — run via `npm run db:seed`")

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) })

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10)
  const teacherPass = await bcrypt.hash("teacher123", 10)
  const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  const school = await prisma.school.upsert({
    where: { email: "school@kinda.test" },
    update: { subscriptionEnd: oneYear },
    create: {
      name: "Sunshine Academy",
      email: "school@kinda.test",
      language: "ENGLISH",
      subscriptionPlan: "TRIAL",
      subscriptionEnd: oneYear,
      trialEndsAt: oneYear,
    },
  })

  // Platform SUPER-ADMIN — no school; manages every school + teacher via /admin.
  await prisma.user.upsert({
    where: { email: "admin@kinda.test" },
    update: { password: adminPass, role: "ADMIN", schoolId: null },
    create: {
      name: "Platform Admin",
      email: "admin@kinda.test",
      password: adminPass,
      role: "ADMIN",
      schoolId: null,
    },
  })

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@kinda.test" },
    update: { password: teacherPass, role: "TEACHER", schoolId: school.id },
    create: {
      name: "Mrs. Amina",
      email: "teacher@kinda.test",
      password: teacherPass,
      role: "TEACHER",
      schoolId: school.id,
    },
  })

  // One class taught by the teacher.
  let klass = await prisma.class.findFirst({
    where: { schoolId: school.id, name: "Nursery A" },
  })
  if (!klass) {
    klass = await prisma.class.create({
      data: { name: "Nursery A", code: "SUNNY2", level: "NURSERY", schoolId: school.id, teacherId: teacher.id },
    })
  } else {
    klass = await prisma.class.update({
      where: { id: klass.id },
      data: { teacherId: teacher.id, code: klass.code ?? "SUNNY2" },
    })
  }

  // A few students. `avatar` holds an animal/fruit character id (lib/characters.ts);
  // `level` is the learning stage the teacher has them on (1–4 — "See & Know"
  // is now the standalone Journey, not a level; see lib/curriculumShared.ts).
  const students = [
    { name: "James", age: 4, avatar: "dog", level: 1 },
    { name: "Amira", age: 5, avatar: "mango", level: 2 },
    { name: "Peter", age: 4, avatar: "zebra", level: 1 },
  ]
  for (const s of students) {
    const existing = await prisma.student.findFirst({ where: { classId: klass.id, name: s.name } })
    if (existing) await prisma.student.update({ where: { id: existing.id }, data: { avatar: s.avatar, level: s.level } })
    else await prisma.student.create({ data: { ...s, classId: klass.id } })
  }

  // Starter curriculum: first 5 letters + numbers 1–5, all stages (1–4)
  // enabled, in order. ("See & Know" is now the standalone Journey, not a
  // curriculum step — see lib/curriculumShared.ts.)
  await prisma.curriculum.upsert({
    where: { classId: klass.id },
    update: { letters: ["A", "B", "C", "D", "E"], steps: [1, 2, 3, 4], numbers: [1, 2, 3, 4, 5], sequential: true },
    create: {
      classId: klass.id,
      module: "LETTERS",
      letters: ["A", "B", "C", "D", "E"],
      steps: [1, 2, 3, 4],
      numbers: [1, 2, 3, 4, 5],
      sequential: true,
    },
  })

  console.log("Seeded:")
  console.log("  School :", school.name)
  console.log("  Admin  : admin@kinda.test / admin123  (super-admin → /admin)")
  console.log("  Teacher: teacher@kinda.test / teacher123")
  console.log("  Class  :", klass.name, "(code", klass.code + ", curriculum A–E, numbers 1–5, steps 1–4)")
  console.log("  Student device: open /student/join and enter", klass.code)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
