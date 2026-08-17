import { createContext, use } from "react"

interface RouteFocusContextValue {
  register: (element: HTMLElement | null) => void
  focusHeading: () => void
}

export const RouteFocusContext = createContext<RouteFocusContextValue | null>(null)

/** Returns a ref-callback a page attaches to its own heading (`ref={useRouteHeading()}`). */
export function useRouteHeading<T extends HTMLElement>() {
  const ctx = use(RouteFocusContext)
  if (!ctx) throw new Error("useRouteHeading must be used within a RouteFocusProvider")
  return (element: T | null) => ctx.register(element)
}

/** Focuses the current page's heading, deferred past the current tick — needed after closing a
    Radix dialog/sheet, whose FocusScope still traps focus for one tick after close. */
export function useRouteHeadingFocus() {
  const ctx = use(RouteFocusContext)
  if (!ctx) throw new Error("useRouteHeadingFocus must be used within a RouteFocusProvider")
  return ctx.focusHeading
}
