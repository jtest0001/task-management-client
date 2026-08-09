import { createContext, use } from "react"

import type { Credentials } from "@/features/auth/api/auth.api"
import type { UserSummary } from "@/types/api"

/**
 * `pending` is the boot window while the refresh cookie is being exchanged for an access
 * token. It is deliberately distinct from `unauthenticated`: treating "we don't know yet" as
 * "signed out" is what makes a refreshed page flash the login screen before bouncing back.
 */
export type AuthStatus = "pending" | "authenticated" | "unauthenticated"

export interface AuthContextValue {
  status: AuthStatus
  user: UserSummary | undefined
  login: (credentials: Credentials) => Promise<void>
  /** Registers, then immediately logs in — the backend's register returns no session. */
  register: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const value = use(AuthContext)
  if (!value) throw new Error("useAuth must be used within an AuthProvider")
  return value
}
