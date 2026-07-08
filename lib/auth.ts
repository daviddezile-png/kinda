import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

// NextAuth v4 (see SPEC-DEVIATIONS.md). Credentials + JWT sessions — no adapter
// (the Prisma adapter is for OAuth/database sessions, not credentials+JWT).
// Teachers and admins sign in with email + password.
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { school: true },
        })
        if (!user) return null
        // A suspended account can no longer sign in (admin control).
        if (!user.isActive) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId, // null for the super-admin
          schoolName: user.school?.name ?? null,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.schoolId = user.schoolId
        token.schoolName = user.schoolName
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role
        session.user.schoolId = token.schoolId
        session.user.schoolName = token.schoolName
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: { strategy: "jwt" },
}
