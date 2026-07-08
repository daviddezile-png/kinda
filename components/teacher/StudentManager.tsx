"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { CHARACTERS, characterById } from "@/lib/characters"
import { STEP_LABELS, clampLevel } from "@/lib/curriculumShared"
import { Picture } from "@/components/ui/Picture"
import { addStudent, setStudentLevel, setStudentModule, removeStudent } from "@/app/teacher/students/actions"

export interface RosterStudent {
  id: string
  name: string
  avatar: string | null
  level: number
  /** What this child studies today: "LETTERS" (ABC) or "MATH" (numbers). */
  module: "LETTERS" | "MATH"
}

export function StudentManager({ classId, students }: { classId: string; students: RosterStudent[] }) {
  const [name, setName] = useState("")
  const [characterId, setCharacterId] = useState(CHARACTERS[0].id)
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState("")

  const visible = students.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))

  const submit = () => {
    if (!name.trim()) return
    startTransition(async () => {
      await addStudent(classId, name, characterId)
      setName("")
    })
  }

  return (
    <div className="space-y-6">
      {/* Register a new student */}
      <div className="rounded-3xl bg-white/80 p-5 shadow-lg">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Register a student</p>
        <div className="flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Child's name"
            className="rounded-2xl border border-gray-200 px-4 py-3 text-lg font-bold text-gray-700 outline-none focus:border-indigo-400"
          />
          <div className="flex flex-wrap gap-2">
            {CHARACTERS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setCharacterId(ch.id)}
                aria-pressed={characterId === ch.id}
                className={`grid h-16 w-16 place-items-center rounded-2xl ring-2 transition ${
                  characterId === ch.id ? "ring-indigo-500 bg-indigo-50" : "ring-transparent bg-gray-50"
                }`}
                title={ch.label}
              >
                <Picture src={ch.image} alt={ch.label} emoji={ch.emoji} emojiClassName="text-3xl" className="h-12 w-12 object-contain" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !name.trim()}
            className="self-start rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50"
          >
            + Add student
          </button>
        </div>
      </div>

      {/* Roster + per-student level control */}
      <div className="rounded-3xl bg-white/80 p-5 shadow-lg">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Class roster ({students.length})
          </p>
          {students.length > 0 && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              className="w-full max-w-48 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400"
            />
          )}
        </div>
        {students.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No students yet — add one above.</p>
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No students match &quot;{query}&quot;.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((s) => {
              const ch = characterById(s.avatar)
              const level = clampLevel(s.level)
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Picture src={ch?.image} alt={ch?.label ?? s.name} emoji={ch?.emoji} emojiClassName="text-2xl" className="h-10 w-10 object-contain" />
                  <Link href={`/teacher/students/${s.id}`} className="min-w-24 flex-1 font-bold text-gray-700 underline-offset-2 hover:underline">
                    {s.name}
                  </Link>

                  {/* What this child studies today — ABC letters or 123 numbers.
                      The child's start button follows this; they never choose. */}
                  <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1" role="group" aria-label={`${s.name}'s subject`}>
                    <button
                      type="button"
                      disabled={pending}
                      aria-pressed={s.module === "LETTERS"}
                      onClick={() => startTransition(() => setStudentModule(s.id, "LETTERS"))}
                      className={`rounded-full px-3 py-1 text-xs font-black transition ${
                        s.module === "LETTERS" ? "bg-indigo-500 text-white shadow" : "text-gray-500"
                      }`}
                    >
                      ABC
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      aria-pressed={s.module === "MATH"}
                      onClick={() => startTransition(() => setStudentModule(s.id, "MATH"))}
                      className={`rounded-full px-3 py-1 text-xs font-black transition ${
                        s.module === "MATH" ? "bg-emerald-500 text-white shadow" : "text-gray-500"
                      }`}
                    >
                      123
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <LevelButton disabled={pending || s.module === "MATH" || level <= 1} onClick={() => startTransition(() => setStudentLevel(s.id, level - 1))}>
                      −
                    </LevelButton>
                    <span className="min-w-32 rounded-full bg-indigo-50 px-3 py-1 text-center text-xs font-bold text-indigo-600">
                      {s.module === "MATH" ? "Numbers 1–10" : `Lv ${level} · ${STEP_LABELS[level]}`}
                    </span>
                    <LevelButton disabled={pending || s.module === "MATH" || level >= 4} onClick={() => startTransition(() => setStudentLevel(s.id, level + 1))}>
                      +
                    </LevelButton>
                  </div>

                  <button
                    type="button"
                    onClick={() => startTransition(() => removeStudent(s.id))}
                    disabled={pending}
                    className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-500 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function LevelButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-lg font-black text-gray-600 disabled:opacity-40"
    >
      {children}
    </button>
  )
}
