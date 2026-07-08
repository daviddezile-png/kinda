import path from "node:path"
import fs from "node:fs"
import { defineConfig } from "@prisma/config"

// Prisma 7 moved the connection URL out of schema.prisma into this config file,
// and it does NOT auto-load .env here. So load DATABASE_URL manually.
function loadDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    const content = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8")
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)\s*$/)
      if (match) return match[1].trim().replace(/^["']|["']$/g, "")
    }
  } catch {
    // no .env file present
  }
  return undefined
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: loadDatabaseUrl(),
  },
})
