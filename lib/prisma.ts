import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

// Prisma 7: runtime queries require a driver adapter. We use PrismaMariaDb
// (backed by the installed mysql2/mariadb driver) and feed it DATABASE_URL.
// The constructor accepts a connection-string directly.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set — see .env (mysql://user:pass@host:port/db)")
  }
  const adapter = new PrismaMariaDb(url)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
