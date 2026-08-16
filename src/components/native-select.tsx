import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A real `<select>` — keyboard- and screen-reader-correct for free, unlike a Radix combobox
 * we don't otherwise need. Styled to match `Input`; callers supply a visually-hidden `<label>`.
 */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input h-9 w-full min-w-0 appearance-none rounded-lg border bg-transparent py-0 pr-8 pl-2.5 text-sm transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
      />
    </div>
  )
}

export { NativeSelect }
