import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlayfulBackground } from "@/components/ui/PlayfulBackground";
import {
  StudentPicker,
  type PickClass,
} from "@/components/student/StudentPicker";

// Read live each request so students the teacher just registered show up.
export const dynamic = "force-dynamic";

// Children pick themselves from the class grid — no password (spec 09). The
// device is bound to ONE class via its join code (see /student/join), so only
// THAT class's children are ever shown — a device can't browse other schools.
export default async function ChooseStudentPage() {
  const joinId = (await cookies()).get("kinda_join")?.value;
  if (!joinId) redirect("/student/join");

  const klass = await prisma.class.findFirst({
    where: { id: joinId, archived: false },
    include: { students: { orderBy: { name: "asc" } } },
  });
  // Code revoked / class archived or deleted → send the device back to re-enter.
  if (!klass) redirect("/student/join");

  const students: PickClass["students"] = klass.students.map(
    (student: { id: string; name: string; avatar: string | null }) => ({
      id: student.id,
      name: student.name,
      avatar: student.avatar,
    }),
  );

  const data: PickClass[] = [
    {
      id: klass.id,
      name: klass.name,
      students,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8">
      <PlayfulBackground />
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Teacher login (shared device) + a way to re-enter a different code.
            In normal flow (not absolutely positioned) so they never overlap
            the title below on narrow screens. */}
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <Link
            href="/student/join"
            className="btn-press glass-card rounded-full px-4 py-2 text-sm font-bold text-gray-500"
          >
            Change class
          </Link>
          <Link
            href="/teacher"
            className="btn-press glass-card rounded-full px-4 py-2 text-sm font-bold text-gray-500"
          >
            Teacher login
          </Link>
        </div>
        <h1 className="mb-6 text-center text-3xl font-black text-gray-700">
          Who is learning today?
        </h1>
        {data[0].students.length === 0 ? (
          <p className="rounded-3xl bg-white/70 py-10 text-center text-gray-400">
            No children in {klass.name} yet — ask your teacher to add them.
          </p>
        ) : (
          <StudentPicker classes={data} />
        )}
      </div>
    </div>
  );
}
