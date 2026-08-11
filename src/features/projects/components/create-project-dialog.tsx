import type { ReactNode } from "react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { useCreateProject } from "@/features/projects/api/projects.mutations"
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog"

/** Default trigger is a labelled button for the projects-index empty state; the sidebar passes
 *  its own icon-only trigger to match the rail heading in the design system. */
export function CreateProjectDialog({ trigger }: { trigger?: ReactNode }) {
  const navigate = useNavigate()
  const createProject = useCreateProject()

  return (
    <ProjectFormDialog
      trigger={trigger ?? <Button size="sm">New project</Button>}
      title="New project"
      description="You become its owner. You can invite people once it exists."
      submitLabel="Create project"
      submittingLabel="Creating…"
      defaultValues={{ name: "", description: "" }}
      onSubmit={async (values) => {
        const project = await createProject.mutateAsync({
          name: values.name,
          description: values.description || undefined
        })
        navigate(`/projects/${project.id}/tasks`)
      }}
    />
  )
}
