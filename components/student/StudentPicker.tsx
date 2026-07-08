"use client"

import { useEffect, useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { chooseStudent } from "@/app/student/actions"
import { characterById } from "@/lib/characters"
import { playUi } from "@/lib/audio"
import { Picture } from "@/components/ui/Picture"

export interface PickClass {
  id: string
  name: string
  students: { id: string; name: string; avatar: string | null }[]
}

const grid = { show: { transition: { staggerChildren: 0.05 } } }
const card = { hidden: { opacity: 0, y: 30, scale: 0.8 }, show: { opacity: 1, y: 0, scale: 1 } }

export function StudentPicker({ classes }: { classes: PickClass[] }) {
  const [classId, setClassId] = useState<string | null>(classes.length === 1 ? classes[0].id : null)
  const [pending, startTransition] = useTransition()

  const selected = classes.find((c) => c.id === classId) ?? null

  // Spoken guidance — this screen greets pre-readers, so the voice does the
  // reading: "touch your class", then "touch your picture" once one is open.
  useEffect(() => {
    playUi(selected ? "touch-your-picture" : "touch-your-class")
  }, [selected])

  return (
    <div className="space-y-6">
      {/* ── Class selector ── */}
      {classes.length > 1 && (
        <div className="rounded-3xl bg-white/70 p-4 shadow-lg">
          <p className="mb-3 text-center text-sm font-bold text-gray-400 uppercase tracking-wide">
            Choose your class
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {classes.map((c) => {
              const active = c.id === classId
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => setClassId(c.id)}
                  whileTap={{ scale: 0.94 }}
                  className={`rounded-2xl px-5 py-3 text-base font-black shadow transition-all ${
                    active
                      ? "bg-indigo-500 text-white shadow-indigo-200 ring-2 ring-indigo-300"
                      : "bg-white text-gray-600 hover:bg-indigo-50"
                  }`}
                >
                  {c.name}
                  <span className={`ml-2 text-xs font-bold ${active ? "text-indigo-200" : "text-gray-400"}`}>
                    ({c.students.length})
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Student grid for selected class ── */}
      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.p
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-10 text-center text-gray-400 font-bold"
          >
            Pick your class above
          </motion.p>
        ) : selected.students.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl bg-white/50 py-10 text-center text-sm text-gray-400"
          >
            No students in {selected.name} yet.
          </motion.p>
        ) : (
          <motion.div
            key={selected.id}
            variants={grid}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
          >
            {selected.students.map((s) => {
              const ch = characterById(s.avatar)
              return (
                <motion.button
                  key={s.id}
                  variants={card}
                  disabled={pending}
                  whileHover={{ y: -6, rotateX: 8, rotateY: -6, scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  style={{ transformPerspective: 800 }}
                  onClick={() => startTransition(() => chooseStudent(selected.id, s.id))}
                  className="flex flex-col items-center gap-2 rounded-3xl bg-white/80 p-5 shadow-[0_16px_30px_-12px_rgba(80,80,160,0.45)] ring-1 ring-white/60"
                >
                  <Picture
                    src={ch?.image}
                    alt={ch?.label ?? s.name}
                    emoji={ch?.emoji}
                    emojiClassName="text-5xl"
                    className="h-20 w-20 object-contain drop-shadow"
                  />
                  <span className="text-lg font-black text-gray-700">{s.name}</span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
