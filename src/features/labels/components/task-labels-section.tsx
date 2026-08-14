import { useQueryClient } from "@tanstack/react-query"
import { Check, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"

import { BusyRegion } from "@/components/busy-region"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useAttachLabel, useDetachLabel } from "@/features/labels/api/labels.mutations"
import { useLabels, useTaskLabels } from "@/features/labels/api/labels.queries"
import { taskLabelKeys } from "@/features/labels/api/labels.keys"
import { useProject } from "@/features/projects/api/projects.queries"
import { canManageLabels } from "@/features/projects/lib/capabilities"
import { toApiError } from "@/lib/api/errors"

interface TaskLabelsSectionProps {
  taskId: string
  projectId: string
}

export function TaskLabelsSection({ taskId, projectId }: TaskLabelsSectionProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: taskLabels, isPending, isError, error } = useTaskLabels(taskId)
  const {
    data: projectLabels,
    isError: isProjectLabelsError,
    error: projectLabelsError,
    refetch: refetchProjectLabels
  } = useLabels(projectId)
  const attachLabel = useAttachLabel(taskId)
  const detachLabel = useDetachLabel(taskId)
  const canManage = canManageLabels(useProject(projectId).data?.role)

  if (isPending) {
    return (
      <section>
        <h3 className="text-sm font-semibold">Labels</h3>
        <BusyRegion label="Loading labels" className="mt-2 flex gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </BusyRegion>
      </section>
    )
  }

  if (isError) {
    return (
      <section>
        <h3 className="text-sm font-semibold">Labels</h3>
        <div role="alert" className="mt-2 text-sm">
          {toApiError(error).message}
        </div>
      </section>
    )
  }

  const attachedIds = new Set(taskLabels.map((label) => label.id))
  const hasProjectLabels = (projectLabels?.length ?? 0) > 0

  const handleDetach = (labelId: string) => {
    // Idempotent server-side — no pre-check, no optimistic rollback needed.
    detachLabel.mutate(labelId, {
      onError: (mutationErr) => toast.error(toApiError(mutationErr).message)
    })
  }

  const toggle = (labelId: string) => {
    if (attachedIds.has(labelId)) {
      handleDetach(labelId)
      return
    }

    attachLabel.mutate(labelId, {
      onError: (mutationErr) => {
        const apiError = toApiError(mutationErr)
        // A 409 here means the cache was stale (already attached), not a real failure —
        // reconcile the cache and move on instead of surfacing an error.
        if (apiError.status === 409) {
          queryClient.invalidateQueries({ queryKey: taskLabelKeys.list(taskId) })
        } else {
          toast.error(apiError.message)
        }
        toast.error(apiError.message)
      }
    })
  }

  return (
    <section>
      <h3 className="text-sm font-semibold">Labels</h3>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {taskLabels.length === 0 && isProjectLabelsError ? (
          <p role="alert" className="text-muted-foreground text-sm">
            {toApiError(projectLabelsError).message}{" "}
            <button
              type="button"
              onClick={() => refetchProjectLabels()}
              className="text-primary font-medium underline underline-offset-4"
            >
              Retry
            </button>
          </p>
        ) : taskLabels.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {hasProjectLabels ? (
              "No labels on this task yet."
            ) : canManage ? (
              <>
                This project has no labels yet.{" "}
                <Link
                  to={`/projects/${projectId}/labels`}
                  className="text-primary font-medium underline underline-offset-4"
                >
                  Add one
                </Link>
                .
              </>
            ) : (
              "This project has no labels yet."
            )}
          </p>
        ) : (
          taskLabels.map((label) => (
            <span
              key={label.id}
              className="bg-secondary inline-flex items-center gap-1.5 rounded-full py-0.5 pr-1 pl-2 text-xs font-medium"
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: label.color }}
                aria-hidden="true"
              />
              {label.name}
              <button
                type="button"
                aria-label={`Remove ${label.name}`}
                onClick={() => handleDetach(label.id)}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))
        )}

        {hasProjectLabels ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                Add label
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="start">
              {projectLabels?.map((label) => {
                const attached = attachedIds.has(label.id)
                return (
                  <button
                    key={label.id}
                    type="button"
                    aria-pressed={attached}
                    onClick={() => toggle(label.id)}
                    className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-sm"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: label.color }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate text-left">{label.name}</span>
                    {attached ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
                  </button>
                )
              })}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    </section>
  )
}
