import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Pagination } from "@/types/api"

/** First/last plus a small window around the current page, with `"…"` gaps. */
function getPageNumbers(current: number, total: number): (number | "…")[] {
  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const result: (number | "…")[] = []
  let previous = 0
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push("…")
    result.push(page)
    previous = page
  }
  return result
}

interface TaskPaginationProps {
  pagination: Pagination
  onPageChange: (page: number) => void
}

export function TaskPagination({ pagination, onPageChange }: TaskPaginationProps) {
  const { page, limit, total, totalPages } = pagination
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <nav
      aria-label="Task list pages"
      className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-sm"
    >
      <span>
        Showing {start}–{end} of {total}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>

        {getPageNumbers(page, totalPages).map((entry, i) =>
          entry === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1.5" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-current={entry === page ? "page" : undefined}
              onClick={() => onPageChange(entry)}
              className={cn(
                "border-border bg-card h-7.5 min-w-7.5 rounded-md border px-1.5 text-sm",
                "hover:bg-muted cursor-pointer",
                entry === page &&
                  "bg-primary text-primary-foreground border-primary hover:bg-primary font-semibold"
              )}
            >
              {entry}
            </button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
