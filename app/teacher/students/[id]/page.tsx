import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurriculumForClass } from "@/lib/curriculum";
import { ALL_STEPS, STEP_LABELS, clampLevel } from "@/lib/curriculumShared";
import { getClassAnalytics } from "@/lib/analytics";
import { characterById } from "@/lib/characters";
import { PlayfulBackground } from "@/components/ui/PlayfulBackground";
import { Picture } from "@/components/ui/Picture";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Per-student analytics: a letters × levels grid of what's done, plus headline
// stats. Reads the Progress rows the daily-learning runtime writes.
export default async function StudentAnalyticsPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: { include: { students: { select: { id: true } } } } },
  });
  if (!student) notFound();
  if (
    session.user.role === "TEACHER" &&
    student.class.teacherId !== session.user.id
  )
    redirect("/teacher");
  if (student.class.schoolId !== session.user.schoolId) redirect("/teacher");

  const { letters } = await getCurriculumForClass(student.classId);
  const progress = await prisma.progress.findMany({
    where: { studentId: id, module: "LETTERS" },
  });
  const rewards = await prisma.studentReward.count({
    where: { studentId: id },
  });

  // Score this child against classmates so "falling behind" is meaningful.
  const analytics = await getClassAnalytics(
    student.class.students.map((student: { id: string }) => student.id),
  );
  const insight = analytics.byStudent.get(id);

  // index by "level:letter"
  const cell = new Map(
    progress.map((entry: { step: number; itemId: string }) => [
      `${entry.step}:${entry.itemId}`,
      entry,
    ]),
  );
  const totalStars = progress.reduce(
    (total: number, entry: { stars: number }) => total + entry.stars,
    0,
  );
  const totalAttempts = progress.reduce(
    (total: number, entry: { attempts: number }) => total + entry.attempts,
    0,
  );
  const completedCount = progress.filter(
    (entry: { completed: boolean }) => entry.completed,
  ).length;
  const lastActive = progress.reduce<Date | null>(
    (latest, entry: { completedAt: Date | null }) =>
      entry.completedAt && (!latest || entry.completedAt > latest)
        ? entry.completedAt
        : latest,
    null,
  );
  const level = clampLevel(student.level);
  const ch = characterById(student.avatar);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6">
      <PlayfulBackground />
      <div className="relative z-10 mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Picture
              src={ch?.image}
              alt={ch?.label ?? student.name}
              emoji={ch?.emoji}
              emojiClassName="text-3xl"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-black text-gray-700">
                {student.name}
              </h1>
              <p className="text-sm text-gray-400">
                {student.class.name} · on{" "}
                <span className="font-bold text-indigo-500">
                  Lv {level} · {STEP_LABELS[level]}
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/teacher/students"
            className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-500 shadow"
          >
            ← Students
          </Link>
        </header>

        {/* Support insight — the headline "does this child need help?" read.
            Three real states: needs support (amber), hasn't started yet
            (neutral — 0 stages done is never "doing well", even if nobody
            else in the class has started either), or doing well (green). */}
        {insight && (
          <div
            className={`mb-6 rounded-3xl p-5 shadow-lg ${
              insight.needsSupport
                ? "bg-amber-50 ring-1 ring-amber-200"
                : insight.completed === 0
                  ? "bg-gray-50 ring-1 ring-gray-200"
                  : "bg-green-50 ring-1 ring-green-200"
            }`}
          >
            {insight.needsSupport ? (
              <>
                <p className="font-black text-amber-700">Needs more support</p>
                <ul className="mt-2 space-y-1">
                  {insight.reasons.map((reason: string) => (
                    <li
                      key={reason}
                      className="text-sm font-bold text-amber-600"
                    >
                      • {reason}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-500/80">
                  {insight.completed} stages done vs class average{" "}
                  {analytics.avgCompleted.toFixed(1)}
                  {insight.retries > 0 ? ` · ${insight.retries} repeats` : ""}
                </p>
              </>
            ) : insight.completed === 0 ? (
              <p className="font-black text-gray-500">
                Hasn&apos;t started yet.
              </p>
            ) : (
              <p className="font-black text-green-600">
                Doing well — {insight.completed} stages done
                {insight.completed >= analytics.avgCompleted
                  ? ", at or above the class average."
                  : "."}
              </p>
            )}
          </div>
        )}

        {/* Headline stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Stages done" value={completedCount} />
          <Stat label="Stars" value={totalStars} accent="text-amber-500" />
          <Stat label="Gifts" value={rewards} accent="text-pink-500" />
          <Stat
            label="Last active"
            value={lastActive ? lastActive.toLocaleDateString() : "—"}
            small
          />
        </div>

        {/* Letters × levels grid */}
        <div className="overflow-x-auto rounded-3xl bg-white/80 p-5 shadow-lg">
          <table className="w-full border-separate border-spacing-1 text-center">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                  Stage
                </th>
                {letters.map((letter: string) => (
                  <th
                    key={letter}
                    className="px-1 text-sm font-black text-gray-500"
                  >
                    {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_STEPS.map((lvl: number) => (
                <tr key={lvl}>
                  <td
                    className={`whitespace-nowrap px-2 py-1 text-left text-xs font-bold ${lvl === level ? "text-indigo-600" : "text-gray-500"}`}
                  >
                    {lvl} · {STEP_LABELS[lvl]}
                  </td>
                  {letters.map((letter: string) => {
                    const p = cell.get(`${lvl}:${letter}`) as
                      | { completed: boolean; attempts: number }
                      | undefined;
                    const done = p?.completed;
                    return (
                      <td key={letter} className="px-0.5">
                        <span
                          title={p ? `${p.attempts} attempt(s)` : "not started"}
                          className={`grid h-8 w-8 place-items-center rounded-lg text-sm ${
                            done
                              ? "bg-green-100 text-green-600"
                              : p
                                ? "bg-amber-50 text-amber-500"
                                : "bg-gray-50 text-gray-300"
                          }`}
                        >
                          {done ? "★" : p ? "·" : ""}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-gray-400">
            ★ completed · · started · {totalAttempts} total attempts across all
            stages
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: number | string;
  accent?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white/80 p-4 shadow-lg">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p
        className={`font-black ${small ? "text-lg" : "text-3xl"} ${accent ?? "text-gray-700"}`}
      >
        {value}
      </p>
    </div>
  );
}
