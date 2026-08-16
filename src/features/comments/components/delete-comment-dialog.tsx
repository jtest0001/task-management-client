import { useRef, useState } from "react"
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
import type { Comment } from "@/features/comments/api/comments.api"
import { useDeleteComment } from "@/features/comments/api/comments.mutations"
import { toApiError } from "@/lib/api/errors"

interface DeleteCommentDialogProps {
  comment: Comment
  taskId: string
  onDeleted?: () => void
}

export function DeleteCommentDialog({ comment, taskId, onDeleted }: DeleteCommentDialogProps) {
  const [open, setOpen] = useState(false)
  const deleteComment = useDeleteComment(comment.id, taskId)
  const deletedRef = useRef(false)

  const handleDelete = async () => {
    try {
      await deleteComment.mutateAsync()
      deletedRef.current = true
      setOpen(false)
    } catch (error) {
      setOpen(false)
      toast.error(toApiError(error).message)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2 text-xs">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          if (!deletedRef.current) return
          // The trigger button unmounts along with the deleted comment, so Radix's default
          // restore-to-trigger has nothing to land on — hand focus to the Comments heading
          // instead, before Radix's own restoration can run and override it.
          event.preventDefault()
          onDeleted?.()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteComment.isPending}
            onClick={(event) => {
              event.preventDefault()
              handleDelete()
            }}
          >
            {deleteComment.isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
