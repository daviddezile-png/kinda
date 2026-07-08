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
  // MySQL 8's default caching_sha2_password auth plugin needs to fetch the
  // server's RSA public key over an unencrypted local connection; the driver
  // refuses to do this unless explicitly allowed.
  const parsedUrl = new URL(url)
  parsedUrl.searchParams.set("allowPublicKeyRetrieval", "true")
  const adapter = new PrismaMariaDb(parsedUrl.toString())
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
