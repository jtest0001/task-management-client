import { EmptyState } from "@/components/empty-state"
import { LabelRow } from "@/features/labels/components/label-row"
import type { Label } from "@/features/labels/api/labels.api"

interface LabelListProps {
  labels: Label[]
  projectId: string
  editable: boolean
  onCreateFocus: () => void
  onLabelDeleted?: () => void
}

export function LabelList({ labels, projectId, editable, onCreateFocus, onLabelDeleted }: LabelListProps) {
  if (labels.length === 0) {
    return (
      <EmptyState
        title="No labels yet"
        description={
          editable
            ? "Labels are per project. Create one and every member can attach it to a task."
            : "Nobody has defined a label for this project yet."
        }
        action={
          editable ? (
            <button
              type="button"
              onClick={onCreateFocus}
              className="text-primary text-sm font-medium underline underline-offset-4"
            >
              Create a label
            </button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {labels.map((label) => (
        <LabelRow
          key={label.id}
          label={label}
          projectId={projectId}
          editable={editable}
          onDeleted={onLabelDeleted}
        />
      ))}
    </div>
  )
}
