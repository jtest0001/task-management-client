import { useEffect, useMemo, useState, type ReactNode } from "react"

import { ThemeContext, type Theme } from "@/lib/theme/theme-context"

const STORAGE_KEY = "taskly-theme"

function resolveSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? resolveSystemTheme() : theme
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

function loadTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
}

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Vite has no `next-themes`, so this reimplements just enough of it: persist the choice,
 * apply `.dark` before paint (see the inline script in index.html), and track the OS
 * preference live while the user hasn't overridden it.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(loadTheme)

  useEffect(() => {
    applyTheme(theme)

    if (theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }

  const value = useMemo(() => ({ theme, setTheme }), [theme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}
