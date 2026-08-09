import { Button } from "@/components/ui/button"
import { toApiError } from "@/lib/api/errors"

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
}

/**
 * Page-level failure state. Shows the backend's own message, which is safe to display —
 * the server maps unexpected failures to a generic "Internal server error" and never leaks
 * stack traces.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const apiError = toApiError(error)

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center"
    >
      <p className="text-sm font-medium">Something went wrong</p>
      <p className="text-muted-foreground max-w-sm text-sm">{apiError.message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
