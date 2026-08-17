import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Makes a horizontally-scrolling table reachable by keyboard at narrow widths — a plain
 * `overflow-x-auto` wrapper has no way to receive focus, so the Due date / action columns are
 * unreachable without a mouse (WCAG 2.1.1).
 */
interface ScrollableTableRegionProps {
  label: string
  className?: string
  children: ReactNode
}

export function ScrollableTableRegion({ label, className, children }: ScrollableTableRegionProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "border-border bg-card overflow-x-auto rounded-xl border shadow-xs focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none",
        className
      )}
    >
      {children}
    </div>
  )
}
