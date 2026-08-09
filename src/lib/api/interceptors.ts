import type { InternalAxiosRequestConfig } from "axios"

import { apiClient } from "./client"
import { toApiError } from "./errors"
import { refreshAccessToken } from "./refresh"
import { getAccessToken } from "./token-store"

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/**
 * Endpoints where a 401 is a real answer rather than an expired access token.
 *
 * Note this is deliberately not "everything under /auth": `GET /auth/me` is an ordinary
 * protected endpoint and *must* participate in the refresh flow, otherwise a boot-time
 * `/me` with a stale token would log the user out instead of refreshing.
 */
const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"]

const shouldAttemptRefresh = (config: RetryableConfig | undefined) => {
  if (!config || config._retry) return false
  const url = config.url ?? ""
  return !NO_REFRESH_PATHS.some((path) => url.startsWith(path))
}

let installed = false

export const installInterceptors = () => {
  if (installed) return
  installed = true

  apiClient.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const apiError = toApiError(error)
      const config = (error as { config?: RetryableConfig }).config

      if (apiError.status !== 401 || !shouldAttemptRefresh(config)) {
        throw apiError
      }

      config!._retry = true

      try {
        await refreshAccessToken()
      } catch {
        // refreshAccessToken has already cleared the token and notified listeners.
        throw apiError
      }

      return apiClient.request(config!)
    }
  )
}
