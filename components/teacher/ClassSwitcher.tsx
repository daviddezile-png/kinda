"use client"

import { useRef, useState, useTransition, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { setActiveClass } from "@/app/teacher/classes/actions"

export interface ClassOption {
  id: string
  name: string
  year: string | null
  term: string | null
  students: number
}

interface ClassSwitcherProps {
  classes: ClassOption[] // active (non-archived) classes only
  activeClassId: string | null
}

// A pill-shaped class selector for the teacher header. Shows the current class
// name; clicking opens a floating dropdown to switch to another class or go to
// the manage-classes page. No separate page navigation required.
export function ClassSwitcher({ classes, activeClassId }: ClassSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  const active = classes.find((c) => c.id === activeClassId)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const choose = (id: string) => {
    if (id === activeClassId) { setOpen(false); return }
    setOpen(false)
    startTransition(() => setActiveClass(id))
  }

  const label = active
    ? [active.name, active.year, active.term].filter(Boolean).join(" · ")
    : "No class"

  return (
    <div ref={ref} className="relative">
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-gray-600 shadow ring-1 ring-white/60 transition hover:bg-white disabled:opacity-60"
      >
        <span className="max-w-[160px] truncate">{pending ? "Switching…" : label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-gray-400"
        >
          ▾
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100"
          >
            {classes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No active classes yet.</p>
            ) : (
              <ul>
                {classes.map((c) => {
                  const isActive = c.id === activeClassId
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => choose(c.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-indigo-50 ${
                          isActive ? "bg-indigo-50" : ""
                        }`}
                      >
                        {/* Active indicator dot */}
                        <span
                          className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                            isActive ? "bg-green-400" : "bg-gray-200"
                          }`}
                        />
                        <span className="min-w-0">
                          <span className={`block truncate text-sm font-bold ${isActive ? "text-indigo-600" : "text-gray-700"}`}>
                            {c.name}
                          </span>
                          <span className="block text-xs text-gray-400">
                            {[c.term, c.year].filter(Boolean).join(" · ") || "—"} · {c.students} students
                          </span>
                        </span>
                        {isActive && (
                          <span className="ml-auto shrink-0 text-xs font-bold text-green-500">✓</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {/* Manage link at the bottom */}
            <div className="border-t border-gray-100 px-4 py-2.5">
              <a
                href="/teacher/classes"
                className="text-xs font-bold text-indigo-500 hover:underline"
                onClick={() => setOpen(false)}
              >
                Manage classes (create / archive)
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
