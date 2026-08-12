import { useMemo } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
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

function initials(email: string) {
  return email.split("@")[0].slice(0, 2).toUpperCase()
}

export function TaskDetailPanel() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { data: task, isPending, isError, error } = useTask(taskId ?? "")
  const { data: members } = useMembers(projectId)

  const assigneeEmail = useMemo(() => {
    if (!task || task.assigneeId === null || !members) return undefined
    return members.find((m) => m.user.id === task.assigneeId)?.user.email
  }, [task, members])

  const listPath = { pathname: `/projects/${projectId}/tasks`, search: searchParams.toString() }

  const close = (open: boolean) => {
    if (!open) navigate(listPath)
  }

  const apiError = isError ? toApiError(error) : undefined
  const isNotFound = apiError?.status === 404

  return (
    <Sheet open onOpenChange={close}>
      <SheetContent className="data-[side=right]:w-full sm:max-w-sm">
        {isPending ? (
          <div className="flex flex-col gap-4 p-4" aria-hidden="true">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {isNotFound ? (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
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
          <>
            <SheetHeader className="border-border gap-0.5 border-b">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Task</p>
              <SheetTitle className="text-base font-semibold">{task.title}</SheetTitle>
              <SheetDescription className="sr-only">Task details</SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
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
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 uppercase"
                      >
                        {initials(assigneeEmail)}
                      </span>
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

              <section>
                <h3 className="text-sm font-semibold">Comments</h3>
                <p className="text-muted-foreground mt-2 text-sm">No comments yet.</p>

                <form className="mt-3 flex flex-col gap-2" noValidate>
                  <label htmlFor="comment-input" className="sr-only">
                    Add a comment
                  </label>
                  <Textarea id="comment-input" placeholder="Add a comment…" disabled />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs">Comments are coming in a later phase.</p>
                    <Button type="button" size="sm" disabled>
                      Comment
                    </Button>
                  </div>
                </form>
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
