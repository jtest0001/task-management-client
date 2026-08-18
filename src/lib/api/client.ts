import axios from "axios"

/**
 * In production this is intentionally empty so axios issues same-origin, relative requests
 * (`/auth/refresh`, `/projects`, ...). Those are proxied to the API by the rewrites in
 * `vercel.json`, which deliberately preserve the path rather than nesting under a prefix:
 * the refresh cookie is scoped `Path=/auth`, so `/api/auth/refresh` would silently never
 * match it. Keeping the browser on one origin is also what lets the refresh cookie stay
 * `SameSite=Lax` — a cross-site setup would force `SameSite=None`, giving up the CSRF
 * protection we get for free. See BACKLOG.md "Security model" for the full reasoning.
 *
 * Locally there is no proxy (see the note in vite.config.ts), so we talk to the API directly.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:3000" : "")

/**
 * The single configured instance every feature module uses.
 *
 * `withCredentials` is what carries the httpOnly refresh cookie; the backend allows this
 * origin with `credentials: true`. Interceptors are attached in `interceptors.ts` and
 * installed once from the app entry point.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
})

/**
 * A bare instance with no interceptors, used only for the refresh call itself so a failing
 * refresh can never re-enter the 401 handler and recurse.
 */
export const bareClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
})
