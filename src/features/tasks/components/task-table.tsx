import { useMemo } from "react"
import { Clock } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskPriorityBadge, TaskStatusChip } from "@/features/tasks/components/task-badges"
import type { Task } from "@/features/tasks/api/tasks.api"
import type { Member } from "@/features/members/api/members.api"
import { hasActiveFilters, type TaskListQuery } from "@/features/tasks/lib/task-list-params"
import { formatDueDate, isOverdue } from "@/lib/utils/date"
import { cn } from "@/lib/utils"

const COLUMNS = ["Title", "Status", "Priority", "Assignee", "Due date"]

export function TaskTableSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  )
}

function AssigneeCell({
  assigneeId,
  members,
  membersPending
}: {
  assigneeId: string | null
  members: Member[] | undefined
  membersPending: boolean
}) {
  const email = useMemo(() => {
    if (assigneeId === null || !members) return undefined
    return members.find((m) => m.user.id === assigneeId)?.user.email
  }, [assigneeId, members])

  if (membersPending) {
    return <span className="text-muted-foreground text-sm">…</span>
  }

  if (assigneeId === null) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
        <span className="bg-muted inline-block size-5 rounded-full text-center leading-5">–</span>
        Unassigned
      </span>
    )
  }

  return <span className="text-sm">{email ? email.split("@")[0] : "Unknown member"}</span>
}

function DueDateCell({ dueDate, status }: { dueDate: string | null; status: Task["status"] }) {
  if (dueDate === null) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  const overdue = status !== "DONE" && isOverdue(dueDate)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm whitespace-nowrap",
        overdue && "text-destructive font-medium"
      )}
    >
      {overdue ? <Clock className="size-3.5" aria-hidden="true" /> : null}
      {formatDueDate(dueDate)}
      {overdue ? " (overdue)" : ""}
    </span>
  )
}

interface TaskTableProps {
  tasks: Task[]
  page: number
  query: TaskListQuery
  members: Member[] | undefined
  membersPending: boolean
  isPlaceholderData: boolean
  onClearFilters: () => void
  onBackToFirstPage: () => void
}

export function TaskTable({
  tasks,
  page,
  query,
  members,
  membersPending,
  isPlaceholderData,
  onClearFilters,
  onBackToFirstPage
}: TaskTableProps) {
  if (tasks.length === 0) {
    if (page > 1) {
      return (
        <EmptyState
          title="That page is empty"
          description="There are no tasks on this page."
          action={
            <Button variant="outline" size="sm" onClick={onBackToFirstPage}>
              Back to first page
            </Button>
          }
        />
      )
    }

    if (hasActiveFilters(query)) {
      return (
        <EmptyState
          title="No tasks match these filters"
          description="Try a different search or clear the filters."
          action={
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          }
        />
      )
    }

    return <EmptyState title="No tasks yet" description="Any project member can create a task." />
  }

  return (
    <div className="table-scroll border-border bg-card overflow-x-auto rounded-xl border shadow-xs">
      <table
        className={cn("w-full border-collapse text-sm", isPlaceholderData && "opacity-60")}
        aria-busy={isPlaceholderData}
      >
        <caption className="sr-only">Tasks</caption>
        <thead>
          <tr className="bg-muted/50">
            {COLUMNS.map((col) => (
              <th
                key={col}
                scope="col"
                className="text-muted-foreground border-border whitespace-nowrap border-t px-3 py-2.5 text-left text-sm font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-muted/50">
              <td className="border-border border-t px-3 py-2.5 font-medium">
                <span className={cn(task.status === "DONE" && "text-muted-foreground line-through")}>
                  {task.title}
                </span>
              </td>
              <td className="border-border border-t px-3 py-2.5">
                <TaskStatusChip status={task.status} />
              </td>
              <td className="border-border border-t px-3 py-2.5">
                <TaskPriorityBadge priority={task.priority} />
              </td>
              <td className="border-border border-t px-3 py-2.5">
                <AssigneeCell assigneeId={task.assigneeId} members={members} membersPending={membersPending} />
              </td>
              <td className="border-border border-t px-3 py-2.5">
                <DueDateCell dueDate={task.dueDate} status={task.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
