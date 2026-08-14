import { useRef } from "react"
import { useParams } from "react-router"

import { ErrorState } from "@/components/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateLabelForm, type CreateLabelFormHandle } from "@/features/labels/components/create-label-form"
import { LabelList } from "@/features/labels/components/label-list"
import { useLabels } from "@/features/labels/api/labels.queries"
import { useProject } from "@/features/projects/api/projects.queries"
import { canManageLabels } from "@/features/projects/lib/capabilities"

function LabelsSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function LabelsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = useProject(projectId).data
  const { data: labels, isPending, isError, error, refetch } = useLabels(projectId)
  const createFormRef = useRef<CreateLabelFormHandle>(null)

  const role = project?.role
  const editable = canManageLabels(role)

  return (
    <div className="flex flex-col gap-4 px-6">
      {/* The active tab already says "Labels" — this is a landmark for screen readers, not a
          visible heading. */}
      <h2 className="sr-only">Labels</h2>

      {isPending && <LabelsSkeleton />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isPending && !isError && labels && projectId ? (
        <>
          {editable ? <CreateLabelForm ref={createFormRef} projectId={projectId} /> : null}
          <LabelList
            labels={labels}
            projectId={projectId}
            editable={editable}
            onCreateFocus={() => createFormRef.current?.focusName()}
          />
        </>
      ) : null}
    </div>
  )
}
