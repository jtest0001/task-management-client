import { bareClient } from "./client"
import { setAccessToken } from "./token-store"

interface RefreshResponse {
  accessToken: string
}

/**
 * Shared in-flight refresh. When several requests 401 at once they all await this same
 * promise, so the server sees exactly one `POST /auth/refresh`.
 *
 * This matters more than it looks: the backend *rotates* the refresh token on every call and
 * invalidates the previous one. Firing three concurrent refreshes would race, and the losers
 * would present an already-rotated token and be logged out.
 */
let inFlight: Promise<string> | null = null

type AuthFailureListener = () => void
const authFailureListeners = new Set<AuthFailureListener>()

/**
 * Register a callback for "the session is gone" — invoked when a refresh attempt fails.
 * This is how the axios layer notifies React without importing the router or a store.
 * Returns an unsubscribe function.
 */
export const onAuthFailure = (listener: AuthFailureListener) => {
  authFailureListeners.add(listener)
  return () => {
    authFailureListeners.delete(listener)
  }
}

const notifyAuthFailure = () => {
  for (const listener of authFailureListeners) listener()
}

export const refreshAccessToken = (): Promise<string> => {
  inFlight ??= bareClient
    .post<RefreshResponse>("/auth/refresh")
    .then((response) => {
      const { accessToken } = response.data
      setAccessToken(accessToken)
      return accessToken
    })
    .catch((error: unknown) => {
      setAccessToken(null)
      notifyAuthFailure()
      throw error
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

/** Test seam: drops any in-flight refresh so cases start from a clean slate. */
export const resetRefreshState = () => {
  inFlight = null
}
