import { Navigate, Outlet, useLocation } from "react-router"

import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"

function BootScreen() {
  return (
    <div className="flex min-h-svh flex-col gap-4 p-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Restoring your session</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

/**
 * Route guard for everything behind a session.
 *
 * While `status` is `pending` this renders a loading screen rather than redirecting — see
 * the note in auth-context.ts on why "unknown" must not collapse into "signed out".
 */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === "pending") return <BootScreen />
  if (status === "unauthenticated") return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}
