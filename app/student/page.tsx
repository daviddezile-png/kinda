import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { characterById } from "@/lib/characters"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { Picture } from "@/components/ui/Picture"
import { Decor } from "@/components/ui/Decor"
import { leaveStudent } from "@/app/student/actions"

// The remembered-student landing (WhatsApp-style). If a child is signed in on this
// device we greet them by name, then let them choose today's world: LETTERS (ABC),
// NUMBERS (1 2 3), or JOURNEY (free picture exploration — no teacher gating).
// The child picks the subject here; everything WITHIN letters/numbers (which
// ones, order, steps) is still the teacher's plan. Not signed in → go choose a
// profile.
export default async function StudentHomePage() {
  const jar = await cookies()
  const classId = jar.get("kinda_class")?.value
  const studentId = jar.get("kinda_student")?.value
  if (!classId || !studentId) redirect("/student/choose")

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student || student.classId !== classId) redirect("/student/choose")

  const character = characterById(student.avatar)

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      <PlayfulBackground />

      {/* Who's playing — the HERO of this screen: the child's own big face, so a
          pre-reader instantly knows it's them. Deliberately larger than the two
          subject cards below. */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <span className="grid h-52 w-52 place-items-center rounded-[3rem] bg-white/80 shadow-[0_30px_66px_-20px_rgba(80,80,160,0.55)] ring-4 ring-white/70 sm:h-64 sm:w-64">
          <Picture
            src={character?.image}
            alt={character?.label ?? student.name}
            emoji={character?.emoji}
            emojiClassName="text-[9rem]"
            className="h-44 w-44 object-contain sm:h-56 sm:w-56"
          />
        </span>
        <span className="text-4xl font-black text-gray-700 drop-shadow-sm sm:text-5xl">{student.name}</span>
      </div>

      {/* Choose today's world: letters, numbers, or a free-exploration Journey.
          Compact, secondary cards (smaller than the profile above) — glyph-first
          so a pre-reader can tell them apart at a glance (the glyphs ARE the
          subject). */}
      <div className="relative z-10 mt-7 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        <Link
          href="/student/learn?mode=letters"
          aria-label={`Learn letters, ${student.name}`}
          className="group flex flex-col items-center justify-center gap-1.5 rounded-[1.75rem] bg-linear-to-br from-[#ff8fb3] to-[#ff6b9d] px-4 py-5 shadow-[0_18px_38px_-16px_rgba(255,107,157,0.7)] ring-4 ring-white/60 transition-transform active:scale-95 sm:hover:-translate-y-1"
        >
          <span className="text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl">ABC</span>
          <span className="rounded-full bg-white/25 px-4 py-0.5 text-sm font-black text-white sm:text-base">
            Letters
          </span>
        </Link>

        <Link
          href="/student/learn?mode=numbers"
          aria-label={`Learn numbers, ${student.name}`}
          className="group flex flex-col items-center justify-center gap-1.5 rounded-[1.75rem] bg-linear-to-br from-[#4dc3f0] to-[#4c6ef5] px-4 py-5 shadow-[0_18px_38px_-16px_rgba(76,110,245,0.7)] ring-4 ring-white/60 transition-transform active:scale-95 sm:hover:-translate-y-1"
        >
          <span className="text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl">1 2 3</span>
          <span className="rounded-full bg-white/25 px-4 py-0.5 text-sm font-black text-white sm:text-base">
            Numbers
          </span>
        </Link>

        <Link
          href="/student/journey"
          aria-label={`Picture journey, ${student.name}`}
          className="group col-span-2 flex flex-col items-center justify-center gap-1.5 rounded-[1.75rem] bg-linear-to-br from-[#8ee6b8] to-[#34c98f] px-4 py-5 shadow-[0_18px_38px_-16px_rgba(52,201,143,0.7)] ring-4 ring-white/60 transition-transform active:scale-95 sm:col-span-1 sm:hover:-translate-y-1"
        >
          <Decor name="kite" size={44} className="drop-shadow-md" />
          <span className="rounded-full bg-white/25 px-4 py-0.5 text-sm font-black text-white sm:text-base">
            Journey
          </span>
        </Link>
      </div>

      <form action={leaveStudent} className="relative z-10 mt-10">
        <button type="submit" className="rounded-full bg-white/70 px-5 py-2 text-sm font-bold text-gray-500 shadow">
          Not me?
        </button>
      </form>
    </div>
  )
}
