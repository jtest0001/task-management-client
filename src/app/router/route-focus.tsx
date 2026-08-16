import { useEffect, useRef, type ReactNode } from "react"
import { useLocation } from "react-router"

import { RouteFocusContext } from "@/app/router/route-focus-context"

/** `/projects/:projectId/tasks/:taskId` — the task detail Sheet has its own Radix focus trap,
    so a route-change focus jump here would fight it instead of helping. */
const TASK_DETAIL_ROUTE = /^\/projects\/[^/]+\/tasks\/[^/]+$/

/**
 * Moves focus to the active page's heading whenever the route changes, so screen reader users
 * hear the new page announced and keyboard users don't lose their place to `<body>` — covers
 * project-tab switches, opening a project, and navigating away after a delete alike. Pages
 * register their own heading via `useRouteHeading`; the last-registered one wins, which is
 * always the most specific page currently on screen.
 */
interface RouteFocusProviderProps {
  children: ReactNode
}

export function RouteFocusProvider({ children }: RouteFocusProviderProps) {
  const location = useLocation()
  const headingRef = useRef<HTMLElement | null>(null)
  const previousPathRef = useRef(location.pathname)

  useEffect(() => {
    const changed = previousPathRef.current !== location.pathname
    previousPathRef.current = location.pathname
    if (!changed) return
    if (TASK_DETAIL_ROUTE.test(location.pathname)) return
    headingRef.current?.focus()
  }, [location.pathname])

  const register = (element: HTMLElement | null) => {
    headingRef.current = element
  }

  const focusHeading = () => {
    setTimeout(() => headingRef.current?.focus())
  }

  return <RouteFocusContext value={{ register, focusHeading }}>{children}</RouteFocusContext>
}
