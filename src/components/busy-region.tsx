import type { ReactNode } from "react"

interface BusyRegionProps {
  /** Announced to screen readers while the region is busy — not shown visually. */
  label: string
  className?: string
  children: ReactNode
}

/**
 * Wraps a skeleton so a screen reader hears something between navigation and data, the same
 * shape `require-auth.tsx`'s `BootScreen` already uses: `aria-busy` + `aria-live="polite"` on
 * the container, an `sr-only` label, and the skeleton itself hidden from the accessibility tree.
 */
export function BusyRegion({ label, className, children }: BusyRegionProps) {
  return (
    <div aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </div>
  )
}
