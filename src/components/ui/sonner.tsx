"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

import { useTheme } from "@/lib/theme/theme-context"

// Upstream shadcn reads the theme from `next-themes`; this reads it from our own
// ThemeProvider instead. Sonner accepts "light" | "dark" | "system" directly, so an
// unresolved "system" value passes straight through to its own OS-preference handling.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      richColors
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // Same red family as priority HIGH — the app already uses a soft-bg + AA-text
          // pairing for that color, so the error toast reuses it instead of inventing one.
          "--error-bg": "var(--priority-high-soft)",
          "--error-text": "var(--priority-high)",
          "--error-border": "color-mix(in oklch, var(--priority-high) 30%, transparent)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
