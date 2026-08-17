import { useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useDeleteLabel } from "@/features/labels/api/labels.mutations"
import { toApiError } from "@/lib/api/errors"
import type { Label } from "@/features/labels/api/labels.api"

interface DeleteLabelDialogProps {
  label: Label
  projectId: string
  onDeleted?: () => void
}

export function DeleteLabelDialog({ label, projectId, onDeleted }: DeleteLabelDialogProps) {
  const [open, setOpen] = useState(false)
  const deleteLabel = useDeleteLabel(label.id, projectId)

  const handleDelete = async () => {
    try {
      await deleteLabel.mutateAsync()
      setOpen(false)
      setTimeout(() => onDeleted?.())
    } catch (error) {
      setOpen(false)
      toast.error(toApiError(error).message)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          aria-label={`Delete ${label.name}`}
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{label.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This is a hard delete, not a soft one — it removes the label from every task that has it,
            immediately and everywhere. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteLabel.isPending}
            onClick={(event) => {
              event.preventDefault()
              handleDelete()
            }}
          >
            {deleteLabel.isPending ? "Deleting…" : "Delete label"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
