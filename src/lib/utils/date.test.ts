import { describe, expect, it } from "vitest"

import { formatDueDate, fromApiDate, toApiDate } from "@/lib/utils/date"

describe("due-date conversion", () => {
  it("sends a date-only input as an ISO datetime the backend accepts", () => {
    expect(toApiDate("2026-08-15")).toBe("2026-08-15T00:00:00.000Z")
  })

  it("round-trips without shifting the day", () => {
    expect(fromApiDate(toApiDate("2026-01-01"))).toBe("2026-01-01")
    expect(fromApiDate(toApiDate("2026-12-31"))).toBe("2026-12-31")
  })

  it("reads a stored instant in UTC, not local time", () => {
    // 00:00Z is the previous day for anyone west of UTC. Reading it locally is the bug this
    // module exists to prevent.
    expect(fromApiDate("2026-08-15T00:00:00.000Z")).toBe("2026-08-15")
    expect(formatDueDate("2026-08-15T00:00:00.000Z")).toBe("Aug 15")
  })
})
