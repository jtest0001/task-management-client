import { useMemo } from "react"
import { Clock } from "lucide-react"
import { Link } from "react-router"

import { BusyRegion } from "@/components/busy-region"
import { EmptyState } from "@/components/empty-state"
import { ScrollableTableRegion } from "@/components/scrollable-table-region"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TaskPriorityBadge, TaskStatusChip } from "@/features/tasks/components/task-badges"
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog"
import type { Task } from "@/features/tasks/api/tasks.api"
import type { Member } from "@/features/members/api/members.api"
import { hasActiveFilters, type TaskListQuery } from "@/features/tasks/lib/task-list-params"
import { formatDueDate, isOverdue } from "@/lib/utils/date"
import { cn } from "@/lib/utils"

const COLUMNS = ["Title", "Status", "Priority", "Assignee", "Due date"]

export function TaskTableSkeleton() {
  return (
    <BusyRegion label="Loading tasks" className="flex flex-col gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </BusyRegion>
  )
}

interface AssigneeCellProps {
  assigneeId: string | null
  members: Member[] | undefined
  membersPending: boolean
}

function AssigneeCell({ assigneeId, members, membersPending }: AssigneeCellProps) {
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

interface DueDateCellProps {
  dueDate: string | null
  status: Task["status"]
}

function DueDateCell({ dueDate, status }: DueDateCellProps) {
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
  search: string
  projectId: string
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
  search,
  projectId,
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

    return (
      <EmptyState
        title="No tasks yet"
        description="Any project member can create a task."
        action={<CreateTaskDialog projectId={projectId} />}
      />
    )
  }

  return (
    <div className="relative">
      {isPlaceholderData ? (
        <div
          aria-hidden="true"
          className="bg-primary/70 absolute inset-x-3 top-0 z-10 h-0.5 animate-pulse rounded-full"
        />
      ) : null}
      <ScrollableTableRegion label="Tasks">
        <Table
          unwrapped
          className={cn(isPlaceholderData && "pointer-events-none")}
          aria-busy={isPlaceholderData}
        >
          <caption className="sr-only">Tasks</caption>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMNS.map((col) => (
                <TableHead key={col} className="text-muted-foreground px-3 py-2.5">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="relative px-3 py-2.5 font-medium whitespace-normal">
                  <Link
                    to={{ pathname: task.id, search }}
                    className={cn(
                      "focus-visible:ring-ring rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-2",
                      task.status === "DONE" && "text-muted-foreground line-through"
                    )}
                  >
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <TaskStatusChip status={task.status} />
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <TaskPriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <AssigneeCell
                    assigneeId={task.assigneeId}
                    members={members}
                    membersPending={membersPending}
                  />
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <DueDateCell dueDate={task.dueDate} status={task.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollableTableRegion>
    </div>
  )
}
