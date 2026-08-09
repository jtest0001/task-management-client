/**
 * The access token lives in module memory only — never in localStorage or a cookie readable
 * by JS. It is lost on page reload by design; `AuthProvider` restores it at boot by calling
 * the refresh endpoint, which authenticates via the httpOnly refresh cookie.
 */
let accessToken: string | null = null

export const getAccessToken = () => accessToken

export const setAccessToken = (token: string | null) => {
  accessToken = token
}
