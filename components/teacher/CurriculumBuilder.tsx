"use client"

import { useState } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { useRouter } from "next/navigation"
import { ALL_STEPS, ALL_NUMBERS, STEP_LABELS } from "@/lib/curriculumShared"
import { LETTER_WORDS } from "@/data/letters/wordList"

interface Props {
  className: string
  availableLetters: string[]
  initial: { letters: string[]; steps: number[]; numbers: number[]; sequential: boolean }
}

export function CurriculumBuilder({ className, availableLetters, initial }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>(initial.letters)
  const [steps, setSteps] = useState<number[]>(initial.steps)
  const [numbers, setNumbers] = useState<number[]>(initial.numbers)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sequential, setSequential] = useState(initial.sequential)

  const toggleLetter = (l: string) =>
    setSelected((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]))

  const toggleStep = (s: number) =>
    setSteps((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s].sort((a, b) => a - b)))

  const toggleNumber = (n: number) =>
    setNumbers((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b)))

  const selectAll = () => setSelected(availableLetters)
  const clearAll = () => setSelected([])

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch("/api/teacher/curriculum", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letters: selected, steps, numbers, sequential }),
    })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error ?? "Could not save.")
      return
    }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  const meta = (l: string) => LETTER_WORDS[l]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* LEFT: pick letters */}
      <section className="rounded-3xl bg-white/80 p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-700">1 · Choose letters</h2>
          <div className="flex gap-2 text-xs font-bold">
            <button onClick={selectAll} className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">All</button>
            <button onClick={clearAll} className="rounded-full bg-rose-100 px-3 py-1 text-rose-600">Clear</button>
          </div>
        </div>
        <p className="mb-3 text-sm text-gray-400">Tap a letter to add it to {className}&apos;s lessons.</p>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
          {availableLetters.map((l) => {
            const on = selected.includes(l)
            const c = meta(l)
            return (
              <motion.button
                key={l}
                onClick={() => toggleLetter(l)}
                whileTap={{ scale: 0.88 }}
                whileHover={{ y: -3 }}
                className="aspect-square rounded-2xl text-xl font-black shadow-sm transition-colors"
                style={{
                  background: on ? `linear-gradient(150deg,#fff, ${c?.bg ?? "#eee"})` : "#f3f4f6",
                  color: on ? c?.color ?? "#444" : "#c2c5cc",
                  boxShadow: on ? "0 8px 18px -6px rgba(0,0,0,.25)" : "none",
                }}
              >
                {l}
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* RIGHT: order + steps + options */}
      <section className="space-y-6">
        <div className="rounded-3xl bg-white/80 p-5 shadow-lg">
          <h2 className="mb-1 text-lg font-black text-gray-700">2 · Set the order</h2>
          <p className="mb-3 text-sm text-gray-400">Drag to arrange the order children learn them.</p>
          {selected.length === 0 ? (
            <p className="rounded-2xl bg-gray-50 py-6 text-center text-sm text-gray-400">No letters yet — pick some on the left.</p>
          ) : (
            <Reorder.Group axis="y" values={selected} onReorder={setSelected} className="flex flex-wrap gap-2">
              <AnimatePresence>
                {selected.map((l, i) => {
                  const c = meta(l)
                  return (
                    <Reorder.Item
                      key={l}
                      value={l}
                      whileDrag={{ scale: 1.12, zIndex: 10 }}
                      className="flex cursor-grab items-center gap-2 rounded-full px-3 py-2 text-sm font-black shadow active:cursor-grabbing"
                      style={{ background: `linear-gradient(150deg,#fff, ${c?.bg ?? "#eee"})`, color: c?.color ?? "#444" }}
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/70 text-xs text-gray-500">{i + 1}</span>
                      {l}
                    </Reorder.Item>
                  )
                })}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </div>

        <div className="rounded-3xl bg-white/80 p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-black text-gray-700">3 · Which steps?</h2>
          <div className="grid grid-cols-2 gap-2">
            {ALL_STEPS.map((s) => {
              const on = steps.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleStep(s)}
                  className={`rounded-2xl px-3 py-3 text-left text-sm font-bold transition-colors ${
                    on ? "bg-indigo-500 text-white shadow" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <span className="block text-xs opacity-70">Step {s}</span>
                  {STEP_LABELS[s]}
                </button>
              )
            })}
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
            <input type="checkbox" checked={sequential} onChange={(e) => setSequential(e.target.checked)} className="h-5 w-5 accent-indigo-500" />
            <span className="text-sm font-bold text-gray-600">
              Sequential — children unlock letters and numbers in order
              <span className="block text-xs font-normal text-gray-400">Off = they may pick any assigned letter or number.</span>
            </span>
          </label>
        </div>

        <div className="rounded-3xl bg-white/80 p-5 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-700">4 · Which numbers?</h2>
            <div className="flex gap-2 text-xs font-bold">
              <button onClick={() => setNumbers([...ALL_NUMBERS])} className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">All</button>
              <button onClick={() => setNumbers([])} className="rounded-full bg-rose-100 px-3 py-1 text-rose-600">Clear</button>
            </div>
          </div>
          <p className="mb-3 text-sm text-gray-400">Tap the numbers {className}&apos;s counting lessons cover.</p>
          <div className="grid grid-cols-5 gap-2">
            {ALL_NUMBERS.map((n) => {
              const on = numbers.includes(n)
              return (
                <motion.button
                  key={n}
                  onClick={() => toggleNumber(n)}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ y: -3 }}
                  className={`aspect-square rounded-2xl text-xl font-black shadow-sm transition-colors ${
                    on ? "bg-linear-to-br from-sky-400 to-indigo-500 text-white" : "bg-gray-100 text-gray-300"
                  }`}
                >
                  {n}
                </motion.button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={save}
            disabled={saving}
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-linear-to-r from-emerald-400 to-teal-500 px-8 py-3 font-bold text-white shadow-lg disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save curriculum"}
          </motion.button>
          {saved && <span className="font-bold text-emerald-600">Saved ✓</span>}
          {error && <span className="font-bold text-rose-500">{error}</span>}
        </div>
      </section>
    </div>
  )
}
