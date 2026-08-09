import { QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter } from "react-router"

import { AuthProvider } from "@/features/auth/auth-provider"
import { createQueryClient } from "@/lib/query/query-client"

interface RenderOptions {
  route?: string
}

/**
 * Renders inside the real provider stack (query client + router + auth) so tests exercise
 * boot and guard behaviour instead of mocking it away. A fresh QueryClient per test keeps
 * cases isolated.
 */
export function renderApp(ui: ReactNode, { route = "/" }: RenderOptions = {}) {
  const queryClient = createQueryClient()
  // Retries would turn a deliberate failure into a multi-second test.
  queryClient.setDefaultOptions({ queries: { retry: false } })

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}
