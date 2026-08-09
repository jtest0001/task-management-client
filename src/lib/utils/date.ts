/**
 * Due dates are conceptually date-only in the UI but travel as full ISO datetimes: the
 * backend validates `dueDate` with `z.iso.datetime()` and rejects a bare `2026-08-15`.
 *
 * Everything here works in UTC on purpose. Parsing an ISO instant and reading it back with
 * local getters is what makes a due date jump a day for anyone west of UTC, so the boundary
 * is crossed in exactly one place — this module.
 */

/** `"2026-08-15"` (an `<input type="date">` value) -> `"2026-08-15T00:00:00.000Z"`. */
export const toApiDate = (dateOnly: string): string => new Date(`${dateOnly}T00:00:00.000Z`).toISOString()

/** `"2026-08-15T00:00:00.000Z"` -> `"2026-08-15"`, suitable for `<input type="date">`. */
export const fromApiDate = (iso: string): string => {
  const date = new Date(iso)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const displayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  timeZone: "UTC"
})

/** `"2026-08-15T00:00:00.000Z"` -> `"Aug 15"`. Rendered in UTC to match the stored date. */
export const formatDueDate = (iso: string): string => displayFormatter.format(new Date(iso))
