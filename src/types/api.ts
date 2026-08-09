/**
 * Domain enums and envelopes shared across features.
 *
 * The backend uses three different response envelopes and this file does not try to hide
 * that: tasks and comments return `{ data, pagination }`, members return `{ data }`, and
 * projects and labels return bare arrays. Each endpoint is typed for what it actually sends.
 */

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH"
export type ProjectRole = "OWNER" | "ADMIN" | "MEMBER"

export interface Pagination {
  page: number
  limit: number
  totalPages: number
  total: number
}

/** `GET /projects/:id/tasks`, `GET /tasks/:id/comments` */
export interface Paginated<T> {
  data: T[]
  pagination: Pagination
}

/** `GET /projects/:id/members` — wrapped, but not paginated. */
export interface Wrapped<T> {
  data: T[]
}

/** The `{ id, email }` projection the backend returns for users everywhere. */
export interface UserSummary {
  id: string
  email: string
}
