import { Navigate, Outlet } from "react-router"

import { useAuth } from "@/features/auth/auth-context"

/**
 * Keeps `/login` and `/register` away from a signed-in user. Renders nothing while the
 * session is still being restored, so a reload on `/login` does not briefly show the form
 * before bouncing to the workspace.
 */
export function RedirectIfAuthenticated() {
  const { status } = useAuth()

  if (status === "pending") return null
  if (status === "authenticated") return <Navigate to="/projects" replace />

  return <Outlet />
}
