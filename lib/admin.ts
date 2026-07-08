import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// The platform super-admin is the only ADMIN role (no school). Every admin
// action re-checks this server-side — defence in depth on top of proxy.ts, so a
// teacher can never reach admin data even by calling an action directly.
export async function getAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}
