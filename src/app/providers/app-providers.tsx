import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { ReactNode } from "react"
import { BrowserRouter } from "react-router"

import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/features/auth/auth-provider"
import { queryClient } from "@/lib/query/query-client"
import { ThemeProvider } from "@/lib/theme/theme-provider"

/**
 * Provider order matters: `AuthProvider` calls into the query client on logout, and it
 * navigates via route guards rather than imperatively, so it sits inside both. `ThemeProvider`
 * is outermost since `Toaster` reads the resolved theme too.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            {children}
            <Toaster position="bottom-right" />
          </AuthProvider>
        </BrowserRouter>
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
