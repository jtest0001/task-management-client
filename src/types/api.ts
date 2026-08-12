/**
 * Cross-feature primitives — types with no single owning feature, either because more than
 * one feature's domain genuinely shares the concept (`ProjectRole`, `UserSummary`) or because
 * they're generic response-envelope shapes reused across several `*.api.ts` files (`Pagination`,
 * `Paginated`, `Wrapped`).
 *
 * A type that belongs to one feature's resource — `Task`, `Comment`, `Member`, `Label`,
 * `Project` — lives in that feature's `api.ts` instead, even when another feature imports it
 * (e.g. `features/tasks/components/task-table.tsx` imports `Member` from
 * `features/members/api/members.api.ts`). "Used elsewhere" isn't the test; "owned by a CRUD
 * resource" is.
 *
 * The backend uses three different response envelopes and this file does not try to hide
 * that: tasks and comments return `{ data, pagination }`, members return `{ data }`, and
 * projects and labels return bare arrays. Each endpoint is typed for what it actually sends.
 */

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
