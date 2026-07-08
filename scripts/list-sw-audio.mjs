// Lists every Swahili audio file path the app expects, so you know exactly what
// to record and where to drop it. Writes public/audio/sw/FILES.txt.
// Run with: node scripts/list-sw-audio.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const dir = join(process.cwd(), "data", "letters", "sw")
const paths = new Set()

function collect(value) {
  if (typeof value === "string") {
    if (value.startsWith("/audio/sw/") && value.endsWith(".mp3")) paths.add(value)
  } else if (Array.isArray(value)) {
    value.forEach(collect)
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(collect)
  }
}

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  collect(JSON.parse(readFileSync(join(dir, file), "utf8")))
}

const sorted = [...paths].sort()
const out = join(process.cwd(), "public", "audio", "sw")
mkdirSync(out, { recursive: true })

const header = [
  "# Swahili audio files to record",
  "#",
  "# Place each .mp3 at: public<path below>  (e.g. /audio/sw/letters/a/letter-a.mp3",
  "# -> public/audio/sw/letters/a/letter-a.mp3). The app plays them automatically;",
  "# missing files are simply silent. Q and X use the English audio.",
  "#",
  `# ${sorted.length} files expected.`,
  "",
]

writeFileSync(join(out, "FILES.txt"), header.concat(sorted).join("\n") + "\n", "utf8")
console.log(`Wrote public/audio/sw/FILES.txt with ${sorted.length} expected files.`)
