import { useEffect, useRef } from "react"
import { Search } from "lucide-react"

import { NativeSelect } from "@/components/native-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Member } from "@/features/members/api/members.api"
import type { TaskListQuery, TaskSortBy, TaskSortOrder } from "@/features/tasks/lib/task-list-params"
import type { TaskPriority, TaskStatus } from "@/features/tasks/api/tasks.api"

const SEARCH_DEBOUNCE_MS = 300

const SORT_PRESETS: { value: string; label: string; sortBy: TaskSortBy; sortOrder: TaskSortOrder }[] = [
  { value: "createdAt:desc", label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
  { value: "createdAt:asc", label: "Oldest first", sortBy: "createdAt", sortOrder: "asc" },
  { value: "dueDate:asc", label: "Due date", sortBy: "dueDate", sortOrder: "asc" },
  { value: "priority:desc", label: "Priority (high first)", sortBy: "priority", sortOrder: "desc" },
  { value: "title:asc", label: "Title (A–Z)", sortBy: "title", sortOrder: "asc" }
]

export type TaskFilterPatch = Partial<
  Pick<TaskListQuery, "search" | "status" | "priority" | "assigneeId" | "sortBy" | "sortOrder">
>

interface TaskToolbarProps {
  query: TaskListQuery
  members: Member[] | undefined
  membersPending: boolean
  onFilterChange: (patch: TaskFilterPatch) => void
}

export function TaskToolbar({ query, members, membersPending, onFilterChange }: TaskToolbarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const lastCommittedRef = useRef(query.search ?? "")
  const onFilterChangeRef = useRef(onFilterChange)

  // Work around to get latest snapshot of onFilterChange in the debounced callback, without having to re-create the callback on every render.
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange
  })

  useEffect(() => {
    const committed = query.search ?? ""
    if (committed !== lastCommittedRef.current && searchInputRef.current) {
      searchInputRef.current.value = committed
      lastCommittedRef.current = committed
    }
  }, [query.search])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const handleSearchChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const trimmed = value.trim()
      lastCommittedRef.current = trimmed
      onFilterChangeRef.current({ search: trimmed || undefined })
    }, SEARCH_DEBOUNCE_MS)
  }

  const sortValue = `${query.sortBy}:${query.sortOrder}`

  return (
    <div className="flex flex-col gap-2">
      <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3 shadow-xs">
        <div className="relative min-w-48 flex-1 basis-64">
          <Label htmlFor="task-search" className="sr-only">
            Search tasks by title
          </Label>
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            id="task-search"
            ref={searchInputRef}
            type="search"
            placeholder="Search task titles…"
            defaultValue={query.search ?? ""}
            className="pl-8"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="min-w-36">
          <Label htmlFor="task-status" className="sr-only">
            Filter by status
          </Label>
          <NativeSelect
            id="task-status"
            value={query.status ?? ""}
            onChange={(e) =>
              onFilterChange({ status: (e.target.value || undefined) as TaskStatus | undefined })
            }
          >
            <option value="">Any status</option>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </NativeSelect>
        </div>

        <div className="min-w-36">
          <Label htmlFor="task-priority" className="sr-only">
            Filter by priority
          </Label>
          <NativeSelect
            id="task-priority"
            value={query.priority ?? ""}
            onChange={(e) =>
              onFilterChange({ priority: (e.target.value || undefined) as TaskPriority | undefined })
            }
          >
            <option value="">Any priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </NativeSelect>
        </div>

        <div className="min-w-40">
          <Label htmlFor="task-assignee" className="sr-only">
            Filter by assignee
          </Label>
          <NativeSelect
            id="task-assignee"
            disabled={membersPending}
            value={query.assigneeId ?? ""}
            onChange={(e) => onFilterChange({ assigneeId: e.target.value || undefined })}
          >
            <option value="">Anyone</option>
            {members?.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.email}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="min-w-44">
          <Label htmlFor="task-sort" className="sr-only">
            Sort tasks
          </Label>
          <NativeSelect
            id="task-sort"
            value={sortValue}
            onChange={(e) => {
              const preset = SORT_PRESETS.find((p) => p.value === e.target.value)
              if (preset) onFilterChange({ sortBy: preset.sortBy, sortOrder: preset.sortOrder })
            }}
          >
            {SORT_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Search matches task titles only, and every filter lives in the URL — this view is shareable.
      </p>
    </div>
  )
}
