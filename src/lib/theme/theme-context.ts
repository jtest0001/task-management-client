import { createContext, use } from "react"

export type Theme = "light" | "dark" | "system"

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useTheme = () => {
  const value = use(ThemeContext)
  if (!value) throw new Error("useTheme must be used within a ThemeProvider")
  return value
}
