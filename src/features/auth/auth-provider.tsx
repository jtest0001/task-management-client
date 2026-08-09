import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"

import { authApi, type Credentials } from "@/features/auth/api/auth.api"
import { authKeys } from "@/features/auth/api/auth.keys"
import { AuthContext, type AuthStatus } from "@/features/auth/auth-context"
import { onAuthFailure, refreshAccessToken } from "@/lib/api/refresh"
import { setAccessToken } from "@/lib/api/token-store"

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>("pending")

  // Boot: the access token is memory-only, so a page load starts with nothing. Exchange the
  // httpOnly refresh cookie for a fresh one. Failure here is the normal signed-out case, not
  // an error worth surfacing.
  useEffect(() => {
    let cancelled = false

    refreshAccessToken()
      .then(() => {
        if (!cancelled) setStatus("authenticated")
      })
      .catch(() => {
        if (!cancelled) setStatus("unauthenticated")
      })

    return () => {
      cancelled = true
    }
  }, [])

  // A refresh that fails mid-session (rotated token reused, session revoked, 7 days elapsed)
  // means the session is gone. The axios layer reports it here rather than knowing about
  // React or the router.
  useEffect(
    () =>
      onAuthFailure(() => {
        setStatus("unauthenticated")
        queryClient.clear()
      }),
    [queryClient]
  )

  const { data: user } = useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    enabled: status === "authenticated",
    staleTime: Infinity
  })

  const login = useCallback(
    async (credentials: Credentials) => {
      const { accessToken, user: loggedInUser } = await authApi.login(credentials)
      setAccessToken(accessToken)
      // Nothing from a previous session should survive a sign-in.
      queryClient.clear()
      queryClient.setQueryData(authKeys.me(), loggedInUser)
      setStatus("authenticated")
    },
    [queryClient]
  )

  const register = useCallback(
    async (credentials: Credentials) => {
      await authApi.register(credentials)
      await login(credentials)
    },
    [login]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // The session is being abandoned either way; a failed revoke must not trap the user
      // in a signed-in UI.
    }
    setAccessToken(null)
    setStatus("unauthenticated")
    queryClient.clear()
  }, [queryClient])

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
