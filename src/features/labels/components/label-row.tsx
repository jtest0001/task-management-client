import { DeleteLabelDialog } from "@/features/labels/components/delete-label-dialog"
import { EditLabelDialog } from "@/features/labels/components/edit-label-dialog"
import type { Label } from "@/features/labels/api/labels.api"

export function LabelRow({ label, projectId, editable }: { label: Label; projectId: string; editable: boolean }) {
  return (
    <div className="border-border bg-card flex items-center gap-3 rounded-lg border px-3 py-2.5">
      <span className="size-2 shrink-0 rounded-full" style={{ background: label.color }} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label.name}</span>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{label.color}</span>
      {editable ? (
        <div className="flex shrink-0 items-center gap-1 border-l pl-2">
          <EditLabelDialog label={label} projectId={projectId} />
          <DeleteLabelDialog label={label} projectId={projectId} />
        </div>
      ) : null}
    </div>
  )
}
