import { useState } from "react"
import { useNavigate } from "react-router"
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
import { useDeleteProject } from "@/features/projects/api/projects.mutations"
import { toApiError } from "@/lib/api/errors"
import type { ProjectSummary } from "@/types/api"

export function DeleteProjectDialog({ project }: { project: ProjectSummary }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const deleteProject = useDeleteProject(project.id)

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync()
      navigate("/projects", { replace: true })
    } catch (error) {
      setOpen(false)
      toast.error(toApiError(error).message)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Delete project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{project.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the project for every member, along with its tasks, comments and labels. This cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteProject.isPending}
            onClick={(event) => {
              event.preventDefault()
              handleDelete()
            }}
          >
            {deleteProject.isPending ? "Deleting…" : "Delete project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
