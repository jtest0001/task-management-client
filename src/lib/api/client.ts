import axios from "axios"

/**
 * Every API route is mounted under `/api` on the server, and in production the browser reaches
 * it same-origin through the rewrite in `vercel.json`. That prefix exists because the app's own
 * page routes (`/projects`, `/projects/:projectId/tasks`, `.../members`, `.../labels`) are
 * identical to the REST routes of the same name — a page navigation and an XHR cannot be told
 * apart by path, so without the prefix the proxy answers page loads with JSON.
 *
 * Staying on a single origin is also what lets the refresh cookie remain `SameSite=Lax`; a
 * cross-site setup would force `SameSite=None` and give up the CSRF protection that comes for
 * free. See BACKLOG.md "Security model" in the API repo for the full reasoning.
 *
 * Locally there is no proxy (see the note in vite.config.ts), so we talk to the API directly.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:3000/api" : "/api")

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
