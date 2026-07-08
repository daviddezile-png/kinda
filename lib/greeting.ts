// Small helpers for a personal, time-of-day-aware staff greeting.

const HONORIFICS = /^(mrs|mr|ms|miss|dr|prof|madam|sir)\.?\s+/i

/** First given name, with a leading honorific (Mrs./Mr./Dr./...) stripped —
 *  so "Mrs. Amina" greets as "Amina", not "Mrs." */
export function firstName(fullName: string | null | undefined): string {
  const name = (fullName ?? "").trim()
  if (!name) return "there"
  return name.replace(HONORIFICS, "").split(" ")[0] || name
}

/** "Good morning" / "Good afternoon" / "Good evening" for the given hour
 *  (0–23, local server time — a single-region school app). */
export function timeGreeting(hour: number = new Date().getHours()): string {
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}
