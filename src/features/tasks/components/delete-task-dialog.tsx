import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { useRouteHeadingFocus } from "@/app/router/route-focus-context"
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
import type { Task } from "@/features/tasks/api/tasks.api"
import { useDeleteTask } from "@/features/tasks/api/tasks.mutations"
import { toApiError } from "@/lib/api/errors"

export function DeleteTaskDialog({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focusHeading = useRouteHeadingFocus()
  const deleteTask = useDeleteTask(task.id, task.projectId)

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync()
      navigate(
        { pathname: `/projects/${task.projectId}/tasks`, search: searchParams.toString() },
        {
          replace: true
        }
      )
      focusHeading()
    } catch (error) {
      setOpen(false)
      toast.error(toApiError(error).message)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Delete task
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{task.title}”?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteTask.isPending}
            onClick={(event) => {
              event.preventDefault()
              handleDelete()
            }}
          >
            {deleteTask.isPending ? "Deleting…" : "Delete task"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
