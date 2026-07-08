"use client"

import { useState, useTransition } from "react"
import { createClass, archiveClass, restoreClass, deleteClass, setActiveClass } from "@/app/teacher/classes/actions"

export interface ClassRow {
  id: string
  name: string
  code: string | null
  year: string | null
  term: string | null
  students: number
  archived: boolean
}

export function ClassManager({ classes, activeClassId }: { classes: ClassRow[]; activeClassId: string | null }) {
  const [name, setName] = useState("")
  const [year, setYear] = useState("")
  const [term, setTerm] = useState("")
  const [pending, startTransition] = useTransition()

  const active = classes.filter((c) => !c.archived)
  const archived = classes.filter((c) => c.archived)

  const create = () => {
    if (!name.trim()) return
    startTransition(async () => {
      await createClass(name, year, term)
      setName("")
      setYear("")
      setTerm("")
    })
  }

  return (
    <div className="space-y-6">
      {/* New class */}
      <div className="rounded-3xl bg-white/80 p-5 shadow-lg">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">New class (new year / term)</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class name" className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 font-bold text-gray-700 outline-none focus:border-indigo-400" />
          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year (2026)" className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-gray-700 outline-none focus:border-indigo-400 sm:w-32" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Term 1" className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-gray-700 outline-none focus:border-indigo-400 sm:w-32" />
          <button type="button" onClick={create} disabled={pending || !name.trim()} className="rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50">
            + Create
          </button>
        </div>
      </div>

      {/* Active classes */}
      <div className="rounded-3xl bg-white/80 p-5 shadow-lg">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Active classes ({active.length})</p>
        <ul className="divide-y divide-gray-100">
          {active.map((c) => {
            const isActive = c.id === activeClassId
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-32 flex-1">
                  <p className="flex items-center gap-2 font-bold text-gray-700">
                    {c.name}
                    {c.code && (
                      <span
                        title="Class code for student devices (/student/join)"
                        className="rounded-lg bg-indigo-50 px-2 py-0.5 font-mono text-xs font-black tracking-widest text-indigo-600"
                      >
                        {c.code}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {[c.term, c.year].filter(Boolean).join(" · ") || "—"} · {c.students} students
                  </p>
                </div>
                {isActive ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-600">Active</span>
                ) : (
                  <button type="button" disabled={pending} onClick={() => startTransition(() => setActiveClass(c.id))} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 disabled:opacity-50">
                    Make active
                  </button>
                )}
                <button type="button" disabled={pending} onClick={() => startTransition(() => archiveClass(c.id))} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 disabled:opacity-50">
                  Archive
                </button>
              </li>
            )
          })}
          {active.length === 0 && <li className="py-6 text-center text-sm text-gray-400">No active classes — create one above.</li>}
        </ul>
      </div>

      {/* Archived classes */}
      {archived.length > 0 && (
        <div className="rounded-3xl bg-white/60 p-5 shadow-lg">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Archived ({archived.length})</p>
          <ul className="divide-y divide-gray-100">
            {archived.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-32 flex-1">
                  <p className="font-bold text-gray-500">{c.name}</p>
                  <p className="text-xs text-gray-400">
                    {[c.term, c.year].filter(Boolean).join(" · ") || "—"} · {c.students} students
                  </p>
                </div>
                <button type="button" disabled={pending} onClick={() => startTransition(() => restoreClass(c.id))} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 disabled:opacity-50">
                  Restore
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Permanently delete "${c.name}"? This removes all ${c.students} student(s), their progress and rewards. This cannot be undone.`,
                      )
                    ) {
                      startTransition(() => deleteClass(c.id))
                    }
                  }}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-500 disabled:opacity-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
