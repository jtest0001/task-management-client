import axios from "axios"

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"

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
