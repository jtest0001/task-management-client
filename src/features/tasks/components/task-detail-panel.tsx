import { useMemo } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"

import { useRouteHeadingFocus } from "@/app/router/route-focus-context"
import { BusyRegion } from "@/components/busy-region"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { UserAvatar } from "@/components/user-avatar"
import { CommentsSection } from "@/features/comments/components/comments-section"
import { TaskLabelsSection } from "@/features/labels/components/task-labels-section"
import { useMembers } from "@/features/members/api/members.queries"
import { useTask } from "@/features/tasks/api/tasks.queries"
import { TaskPriorityBadge, TaskStatusChip } from "@/features/tasks/components/task-badges"
import { DeleteTaskDialog } from "@/features/tasks/components/delete-task-dialog"
import { EditTaskDialog } from "@/features/tasks/components/edit-task-dialog"
import { toApiError } from "@/lib/api/errors"
import { formatDueDate, isOverdue } from "@/lib/utils/date"

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric"
})

export function TaskDetailPanel() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focusHeading = useRouteHeadingFocus()

  const { data: task, isPending, isError, error } = useTask(taskId ?? "")
  const { data: members } = useMembers(projectId)

  const assigneeEmail = useMemo(() => {
    if (!task || task.assigneeId === null || !members) return undefined
    return members.find((m) => m.user.id === task.assigneeId)?.user.email
  }, [task, members])

  const listPath = { pathname: `/projects/${projectId}/tasks`, search: searchParams.toString() }

  const close = (open: boolean) => {
    if (open) return
    navigate(listPath)
    focusHeading()
  }

  const apiError = isError ? toApiError(error) : undefined
  const isNotFound = apiError?.status === 404

  return (
    <Sheet open onOpenChange={close}>
      <SheetContent className="data-[side=right]:w-full sm:max-w-md">
        {isPending ? (
          <BusyRegion label="Loading task" className="flex flex-col gap-4 p-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </BusyRegion>
        ) : null}

        {isNotFound ? (
          <div role="alert" className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-medium">This task no longer exists</p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link to={listPath}>Back to tasks</Link>
            </Button>
          </div>
        ) : null}

        {isError && !isNotFound ? (
          <div role="alert" className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-medium">Something went wrong</p>
            <p className="text-muted-foreground max-w-sm text-sm">{apiError?.message}</p>
          </div>
        ) : null}

        {task ? (
          <SheetHeader className="border-border gap-0.5 border-b">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Task</p>
            <SheetTitle className="text-base font-semibold">{task.title}</SheetTitle>
            <SheetDescription className="sr-only">Task details</SheetDescription>
          </SheetHeader>
        ) : null}

        {/* Mounted as soon as `taskId` is known, not gated on `task` — otherwise the comments
            fetch waterfalls behind the task fetch instead of running alongside it. */}
        {!isError && taskId ? (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
            {task ? (
              <>
                <p className="text-sm">
                  {task.description || <span className="text-muted-foreground">No description.</span>}
                </p>

                <dl className="grid grid-cols-[6rem_1fr] items-center gap-x-3 gap-y-2.5 text-sm">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <TaskStatusChip status={task.status} />
                  </dd>

                  <dt className="text-muted-foreground">Priority</dt>
                  <dd>
                    <TaskPriorityBadge priority={task.priority} />
                  </dd>

                  <dt className="text-muted-foreground">Assignee</dt>
                  <dd>
                    {assigneeEmail ? (
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <UserAvatar email={assigneeEmail} />
                        <span className="truncate">{assigneeEmail}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </dd>

                  <dt className="text-muted-foreground">Due date</dt>
                  <dd>
                    {task.dueDate ? (
                      <span
                        className={task.status !== "DONE" && isOverdue(task.dueDate) ? "text-destructive" : ""}
                      >
                        {formatDueDate(task.dueDate)}
                        {task.status !== "DONE" && isOverdue(task.dueDate) ? " (overdue)" : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </dd>

                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="text-muted-foreground">
                    {dateTimeFormatter.format(new Date(task.createdAt))}
                  </dd>

                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="text-muted-foreground">
                    {dateTimeFormatter.format(new Date(task.updatedAt))}
                  </dd>
                </dl>

                <div className="flex gap-2">
                  <EditTaskDialog task={task} />
                  <DeleteTaskDialog task={task} />
                </div>
              </>
            ) : null}

            {projectId ? <TaskLabelsSection taskId={taskId} projectId={projectId} /> : null}
            <CommentsSection taskId={taskId} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
