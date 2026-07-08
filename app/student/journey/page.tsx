import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { Decor } from "@/components/ui/Decor"

// The Journey picker — free picture exploration, independent of the teacher's
// letters/numbers curriculum and of the child's level. Two journeys: the
// existing "See & Know" picture tour (Word Journey) and a new all-animals tour
// (Animal Journey). Reachable any time from the /student subject picker.
export default async function JourneyPage() {
  const jar = await cookies()
  const classId = jar.get("kinda_class")?.value
  const studentId = jar.get("kinda_student")?.value
  if (!classId || !studentId) redirect("/student/choose")

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student || student.classId !== classId) redirect("/student/choose")

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      <PlayfulBackground />

      <Link
        href="/student"
        aria-label="Home"
        className="absolute left-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/70 shadow"
      >
        <Decor name="home" size={26} />
      </Link>

      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <Decor name="kite" size={64} />
        <h1 className="text-3xl font-black text-gray-700 sm:text-4xl">Pick a Journey!</h1>
      </div>

      <div className="relative z-10 mt-8 grid w-full max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
        <Link
          href="/student/discover"
          aria-label="Word Journey — tour every picture"
          className="group flex aspect-4/3 flex-col items-center justify-center gap-3 rounded-[2.5rem] bg-linear-to-br from-[#ffb199] to-[#ff6b9d] p-6 shadow-[0_24px_50px_-18px_rgba(255,107,157,0.7)] ring-4 ring-white/60 transition-transform active:scale-95 sm:hover:-translate-y-1.5"
        >
          <Decor name="apple" size={64} />
          <span className="rounded-full bg-white/25 px-5 py-1.5 text-lg font-black text-white sm:text-xl">
            Word Journey
          </span>
        </Link>

        <Link
          href="/student/journey/animals"
          aria-label="Animal Journey — meet every animal"
          className="group flex aspect-4/3 flex-col items-center justify-center gap-3 rounded-[2.5rem] bg-linear-to-br from-[#a5e8c1] to-[#34c98f] p-6 shadow-[0_24px_50px_-18px_rgba(52,201,143,0.7)] ring-4 ring-white/60 transition-transform active:scale-95 sm:hover:-translate-y-1.5"
        >
          <Decor name="butterfly" size={64} />
          <span className="rounded-full bg-white/25 px-5 py-1.5 text-lg font-black text-white sm:text-xl">
            Animal Journey
          </span>
        </Link>
      </div>
    </div>
  )
}
