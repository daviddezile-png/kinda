"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  /** Hidden input name — the selected option's value is submitted under this
   *  name, so this drop-in works with plain FormData server actions. */
  name: string
  options: SearchableSelectOption[]
  placeholder?: string
  required?: boolean
  className: string
  defaultValue?: string
}

// A type-to-filter dropdown for staff forms with long option lists (e.g. picking
// a school out of dozens). Renders a text input that filters the option list as
// you type, plus a hidden input carrying the chosen value for FormData submission.
export function SearchableSelect({ name, options, placeholder, required, className, defaultValue }: SearchableSelectProps) {
  const initial = options.find((o) => o.value === defaultValue) ?? null
  const [query, setQuery] = useState(initial?.label ?? "")
  const [selected, setSelected] = useState<SearchableSelectOption | null>(initial)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || selected?.label === query) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query, selected])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const choose = (opt: SearchableSelectOption) => {
    setSelected(opt)
    setQuery(opt.label)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={selected?.value ?? ""} required={required} />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelected(null)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-4 py-2 text-sm text-gray-400">No matches.</p>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => choose(opt)}
                className={`block w-full px-4 py-2 text-left text-sm font-bold hover:bg-indigo-50 ${
                  opt.value === selected?.value ? "bg-indigo-50 text-indigo-600" : "text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
