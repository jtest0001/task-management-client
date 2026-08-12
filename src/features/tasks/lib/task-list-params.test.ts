import { describe, expect, it } from "vitest"

import {
  hasActiveFilters,
  parseTaskListParams,
  toTaskListSearchParams,
  type TaskListQuery
} from "@/features/tasks/lib/task-list-params"

const defaults: TaskListQuery = {
  page: 1,
  search: undefined,
  status: undefined,
  priority: undefined,
  assigneeId: undefined,
  sortBy: "createdAt",
  sortOrder: "desc"
}

describe("parseTaskListParams", () => {
  it("returns the defaults for an empty URLSearchParams", () => {
    expect(parseTaskListParams(new URLSearchParams())).toEqual(defaults)
  })

  it.each([
    ["page", "0"],
    ["page", "1.5"],
    ["page", "abc"],
    ["page", "-3"],
    ["status", "BOGUS"],
    ["priority", "URGENT"],
    ["assigneeId", "not-a-uuid"],
    ["sortBy", "updatedAt"],
    ["sortOrder", "sideways"]
  ])("falls back to the default when %s=%s", (key, value) => {
    const params = new URLSearchParams({ [key]: value })
    const parsed = parseTaskListParams(params)
    expect(parsed).toEqual(defaults)
  })

  it("trims and length-caps search", () => {
    const params = new URLSearchParams({ search: `  ${"a".repeat(300)}  ` })
    const parsed = parseTaskListParams(params)
    expect(parsed.search).toHaveLength(255)
    expect(parsed.search).toBe("a".repeat(255))
  })

  it("drops a blank search after trimming", () => {
    const params = new URLSearchParams({ search: "   " })
    expect(parseTaskListParams(params).search).toBeUndefined()
  })

  it("accepts legal status, priority, assigneeId, sortBy and sortOrder", () => {
    const params = new URLSearchParams({
      status: "DONE",
      priority: "HIGH",
      assigneeId: "6f5d7b8e-3c1a-4e2b-9f0d-1a2b3c4d5e6f",
      sortBy: "dueDate",
      sortOrder: "asc"
    })
    expect(parseTaskListParams(params)).toEqual({
      page: 1,
      search: undefined,
      status: "DONE",
      priority: "HIGH",
      assigneeId: "6f5d7b8e-3c1a-4e2b-9f0d-1a2b3c4d5e6f",
      sortBy: "dueDate",
      sortOrder: "asc"
    })
  })

  it("accepts a legal page", () => {
    expect(parseTaskListParams(new URLSearchParams({ page: "3" })).page).toBe(3)
  })
})

describe("toTaskListSearchParams", () => {
  it("writes nothing for the default query", () => {
    expect(toTaskListSearchParams(defaults).toString()).toBe("")
  })

  it("round-trips through parse", () => {
    const query: TaskListQuery = {
      page: 2,
      search: "contrast",
      status: "TODO",
      priority: "LOW",
      assigneeId: "6f5d7b8e-3c1a-4e2b-9f0d-1a2b3c4d5e6f",
      sortBy: "title",
      sortOrder: "asc"
    }
    const params = toTaskListSearchParams(query)
    expect(parseTaskListParams(params)).toEqual(query)
  })
})

describe("hasActiveFilters", () => {
  it("is true when search, status, priority or assigneeId is set", () => {
    expect(hasActiveFilters({ ...defaults, search: "x" })).toBe(true)
    expect(hasActiveFilters({ ...defaults, status: "DONE" })).toBe(true)
    expect(hasActiveFilters({ ...defaults, priority: "HIGH" })).toBe(true)
    expect(hasActiveFilters({ ...defaults, assigneeId: "6f5d7b8e-3c1a-4e2b-9f0d-1a2b3c4d5e6f" })).toBe(true)
  })

  it("is false for sort or page alone", () => {
    expect(hasActiveFilters({ ...defaults, page: 3 })).toBe(false)
    expect(hasActiveFilters({ ...defaults, sortBy: "title", sortOrder: "asc" })).toBe(false)
  })
})
