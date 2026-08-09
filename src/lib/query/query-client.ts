import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/errors"

/** Retrying these is pointless — the answer will not change on a second attempt. */
const NON_RETRYABLE = new Set([400, 401, 403, 404, 409])

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && NON_RETRYABLE.has(error.status)) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: false
      },
      mutations: {
        retry: false
      }
    }
  })

export const queryClient = createQueryClient()
