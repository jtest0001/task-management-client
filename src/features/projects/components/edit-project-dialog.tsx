import { Button } from "@/components/ui/button"
import { useUpdateProject } from "@/features/projects/api/projects.mutations"
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog"
import type { CreateProjectInput } from "@/features/projects/api/projects.api"
import type { ProjectSummary } from "@/types/api"

export function EditProjectDialog({ project }: { project: ProjectSummary }) {
  const updateProject = useUpdateProject(project.id)

  return (
    <ProjectFormDialog
      trigger={
        <Button variant="outline" size="sm">
          Edit Project
        </Button>
      }
      title="Edit project"
      description="Update the name or description. Members are not notified."
      submitLabel="Save changes"
      submittingLabel="Saving…"
      defaultValues={{ name: project.name, description: project.description ?? "" }}
      onSubmit={async (values) => {
        // `PATCH` rejects `{}` — send only fields that actually changed. An empty string is
        // sent as-is (not omitted) so clearing the description actually reaches the server.
        const patch: Partial<CreateProjectInput> = {}
        if (values.name !== project.name) patch.name = values.name

        const nextDescription = values.description ?? ""
        if (nextDescription !== (project.description ?? "")) {
          patch.description = nextDescription
        }

        if (Object.keys(patch).length === 0) return
        await updateProject.mutateAsync(patch)
      }}
    />
  )
}
