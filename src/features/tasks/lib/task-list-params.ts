import type { TaskPriority, TaskStatus } from "@/types/api"

export type TaskSortBy = "createdAt" | "dueDate" | "priority" | "title"
export type TaskSortOrder = "asc" | "desc"

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"]
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"]
const SORT_BYS: TaskSortBy[] = ["createdAt", "dueDate", "priority", "title"]
const SORT_ORDERS: TaskSortOrder[] = ["asc", "desc"]

const DEFAULT_SORT_BY: TaskSortBy = "createdAt"
const DEFAULT_SORT_ORDER: TaskSortOrder = "desc"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface TaskListQuery {
  page?: number
  limit?: number
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  sortBy: TaskSortBy
  sortOrder: TaskSortOrder
}

function parsePage(raw: string | null): number | undefined {
  if (raw === null) return undefined
  const value = Number(raw)
  return Number.isInteger(value) && value >= 1 ? value : undefined
}

function parseLimit(raw: string | null): number | undefined {
  if (raw === null) return undefined
  const value = Number(raw)
  return Number.isInteger(value) && value >= 1 ? value : undefined
}

function parseSearch(raw: string | null): string | undefined {
  if (raw === null) return undefined
  const trimmed = raw.trim().slice(0, 255)
  return trimmed.length > 0 ? trimmed : undefined
}

function parseEnum<T extends string>(raw: string | null, allowed: T[]): T | undefined {
  return raw !== null && (allowed as string[]).includes(raw) ? (raw as T) : undefined
}

function parseAssigneeId(raw: string | null): string | undefined {
  return raw !== null && UUID_RE.test(raw) ? raw : undefined
}

/**
 * Every garbage value falls back to the default instead of propagating — the server 400s on
 * an invalid `status`/`priority`/`assigneeId`/`page`, so the URL must be sanitised before it
 * ever becomes a query key.
 */
export function parseTaskListParams(searchParams: URLSearchParams): TaskListQuery {
  return {
    page: parsePage(searchParams.get("page")),
    limit: parseLimit(searchParams.get("limit")),
    search: parseSearch(searchParams.get("search")),
    status: parseEnum(searchParams.get("status"), STATUSES),
    priority: parseEnum(searchParams.get("priority"), PRIORITIES),
    assigneeId: parseAssigneeId(searchParams.get("assigneeId")),
    sortBy: parseEnum(searchParams.get("sortBy"), SORT_BYS) ?? DEFAULT_SORT_BY,
    sortOrder: parseEnum(searchParams.get("sortOrder"), SORT_ORDERS) ?? DEFAULT_SORT_ORDER
  }
}

/** Writes only non-default values, so the unfiltered list is a bare `/projects/:id/tasks`. */
export function toTaskListSearchParams(query: TaskListQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.page) params.set("page", String(query.page))
  if (query.limit) params.set("limit", String(query.limit))
  if (query.search) params.set("search", query.search)
  if (query.status) params.set("status", query.status)
  if (query.priority) params.set("priority", query.priority)
  if (query.assigneeId) params.set("assigneeId", query.assigneeId)
  if (query.sortBy !== DEFAULT_SORT_BY) params.set("sortBy", query.sortBy)
  if (query.sortOrder !== DEFAULT_SORT_ORDER) params.set("sortOrder", query.sortOrder)
  return params
}

export function hasActiveFilters(query: TaskListQuery): boolean {
  return Boolean(query.search || query.status || query.priority || query.assigneeId)
}
