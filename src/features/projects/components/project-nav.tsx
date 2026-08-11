import { PlusIcon } from "lucide-react"
import { NavLink, useParams } from "react-router"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useProject, useProjects } from "@/features/projects/api/projects.queries"
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog"
import { InviteTeammatesCard } from "@/features/projects/components/invite-teammates-card"
import { canAddMembersToProject } from "@/features/projects/lib/capabilities"
import { toApiError } from "@/lib/api/errors"
import { cn } from "@/lib/utils"
import type { ProjectSummary } from "@/types/api"

/**
 * The sidebar's project list. Mounted for the whole signed-in session — see
 * `projectsQueryOptions` — so this is also where a session-wide fetch failure first surfaces.
 */
function ProjectNavSkeleton() {
  return (
    <ul className="flex flex-col gap-1">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <Skeleton className="h-8 w-full rounded-lg" />
        </li>
      ))}
    </ul>
  )
}

function ProjectNavError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 px-2">
      <p className="text-muted-foreground text-sm">{toApiError(error).message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function ProjectNavList({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) {
    return <p className="text-muted-foreground px-2 text-sm">No projects yet</p>
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {projects.map((project) => (
        <li key={project.id}>
          <NavLink
            to={`/projects/${project.id}`}
            end={false}
            className={({ isActive }) =>
              cn(
                "text-foreground hover:bg-muted relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                isActive &&
                  "bg-accent text-accent-foreground before:bg-brand hover:bg-accent font-medium before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full"
              )
            }
          >
            <span className="min-w-0 flex-1 truncate">{project.name}</span>
            <span
              className={cn(
                "text-muted-foreground bg-secondary shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide",
                project.role === "OWNER" && "bg-accent text-accent-foreground"
              )}
            >
              {project.role}
            </span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function ProjectNav() {
  const { projectId } = useParams()
  const { data: projects, isPending, isError, error, refetch } = useProjects()
  const { data: selectedProject } = useProject(projectId)

  return (
    <nav aria-label="Projects" className="flex h-full flex-col gap-4 px-3 py-4">
      <div className="flex items-center justify-between gap-2 px-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
          Projects
        </span>
        <CreateProjectDialog
          trigger={
            <Button variant="ghost" size="icon-sm" aria-label="New project">
              <PlusIcon />
            </Button>
          }
        />
      </div>

      {isPending && <ProjectNavSkeleton />}
      {isError && <ProjectNavError error={error} onRetry={() => refetch()} />}
      {!isPending && !isError && <ProjectNavList projects={projects} />}

      {selectedProject && canAddMembersToProject(selectedProject.role) && (
        <InviteTeammatesCard projectId={selectedProject.id} />
      )}
    </nav>
  )
}
