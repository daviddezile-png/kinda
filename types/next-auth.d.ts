import type { Role } from "@prisma/client"
import type { DefaultSession } from "next-auth"

// Augment NextAuth types with our app-specific fields (role, school).
declare module "next-auth" {
  interface User {
    role: Role
    schoolId: string | null // null for the platform super-admin
    schoolName?: string | null
  }

  interface Session {
    user: {
      id: string
      role: Role
      schoolId: string | null
      schoolName?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    schoolId: string | null
    schoolName?: string | null
  }
}
