import { RotateCw, TriangleAlert } from "lucide-react"
import { Component, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

/**
 * Catches render-time throws that would otherwise take the whole app to a white screen —
 * `router.tsx` uses `<Routes>`, not a data router, so there is no `errorElement` to fall back to.
 *
 * Deliberately generic: whatever the underlying error was, an end user can't act on it and
 * shouldn't see it. Reloading is the only recovery a static class boundary like this can offer.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-canvas flex min-h-svh items-center justify-center p-8">
          <div
            role="alert"
            className="border-border bg-card flex max-w-sm flex-col items-center gap-3 rounded-xl border p-8 text-center shadow-sm"
          >
            <span className="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-full">
              <TriangleAlert aria-hidden="true" className="size-5" />
            </span>
            <p className="font-semibold">Something went wrong</p>
            <p className="text-muted-foreground text-sm">
              We hit an unexpected error and couldn't finish loading this page. Reloading usually fixes it. If
              it keeps happening, try again in a few minutes.
            </p>
            <Button className="mt-2" onClick={() => window.location.reload()}>
              <RotateCw aria-hidden="true" />
              Reload page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
