import { useRef } from "react"
import { useParams } from "react-router"

import { useRouteHeading } from "@/app/router/route-focus-context"
import { BusyRegion } from "@/components/busy-region"
import { ErrorState } from "@/components/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateLabelForm, type CreateLabelFormHandle } from "@/features/labels/components/create-label-form"
import { LabelList } from "@/features/labels/components/label-list"
import { useLabels } from "@/features/labels/api/labels.queries"
import { useProject } from "@/features/projects/api/projects.queries"
import { canManageLabels } from "@/features/projects/lib/capabilities"

function LabelsSkeleton() {
  return (
    <BusyRegion label="Loading labels" className="flex flex-col gap-2">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </BusyRegion>
  )
}

export function LabelsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const registerRouteHeading = useRouteHeading<HTMLHeadingElement>()
  const {
    data: project,
    isPending: isProjectPending,
    isError: isProjectError,
    error: projectError,
    refetch: refetchProject
  } = useProject(projectId)
  const { data: labels, isPending: isLabelsPending, isError, error, refetch } = useLabels(projectId)
  const createFormRef = useRef<CreateLabelFormHandle>(null)

  const role = project?.role
  const editable = canManageLabels(role)

  return (
    <div className="flex flex-col gap-4 px-6">
      {/* The active tab already says "Labels" — this is a landmark for screen readers, not a
          visible heading. Also the focus target after a route change and after deleting a
          label, since its trigger button unmounts along with the row. */}
      <h2
        ref={(el) => {
          headingRef.current = el
          registerRouteHeading(el)
        }}
        tabIndex={-1}
        className="sr-only outline-none"
      >
        Labels
      </h2>

      {isProjectError ? (
        <ErrorState error={projectError} onRetry={() => refetchProject()} />
      ) : (
        <>
          {(isProjectPending || isLabelsPending) && <LabelsSkeleton />}
          {isError && <ErrorState error={error} onRetry={() => refetch()} />}

          {!isProjectPending && !isLabelsPending && !isError && labels && projectId ? (
            <>
              {editable ? <CreateLabelForm ref={createFormRef} projectId={projectId} /> : null}
              <LabelList
                labels={labels}
                projectId={projectId}
                editable={editable}
                onCreateFocus={() => createFormRef.current?.focusName()}
                onLabelDeleted={() => headingRef.current?.focus()}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
