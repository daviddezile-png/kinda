"use client"

import { useState } from "react"

interface PasswordFieldProps {
  name: string
  placeholder?: string
  required?: boolean
  minLength?: number
  className: string
  autoComplete?: string
  /** Controlled usage (e.g. the login form, which reads password from state
   *  before calling next-auth's signIn). Omit for plain uncontrolled/FormData
   *  usage (server-action forms). */
  value?: string
  onChange?: (value: string) => void
}

// A password input with a show/hide toggle — staff (teachers/admins) often type
// these on shared devices, so being able to check what was typed avoids lockouts
// from a mistyped password.
export function PasswordField({ name, placeholder, required, minLength, className, autoComplete, value, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const controlled = value !== undefined

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`${className} pr-11`}
        placeholder={placeholder}
        {...(controlled
          ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) }
          : {})}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 hover:text-gray-600"
      >
        {/* Simple eye glyph — no dedicated Decor icon exists for this, and it's a
            staff-only control (not child-facing), so a plain SVG is appropriate. */}
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}
