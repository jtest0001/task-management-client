import { Link } from "react-router"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        That page doesn't exist, or it's no longer available to you.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-2">
        <Link to="/projects">Back to projects</Link>
      </Button>
    </main>
  )
}
