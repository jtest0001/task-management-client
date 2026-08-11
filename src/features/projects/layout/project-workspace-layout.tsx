import { Link, Outlet, useParams } from "react-router"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteProjectDialog } from "@/features/projects/components/delete-project-dialog"
import { ProjectTabs } from "@/features/projects/components/project-tabs"
import { EditProjectDialog } from "@/features/projects/components/edit-project-dialog"
import { useProject, useProjects } from "@/features/projects/api/projects.queries"
import { canManageProject } from "@/features/projects/lib/capabilities"
import { cn } from "@/lib/utils"
import type { ProjectSummary } from "@/types/api"

function WorkspaceHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  )
}

function WorkspaceHeader({ project }: { project: ProjectSummary }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 px-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
          <span
            className={cn(
              "text-muted-foreground bg-secondary shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide",
              project.role === "OWNER" && "bg-accent text-accent-foreground"
            )}
          >
            {project.role}
          </span>
        </div>

        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          {project.description ? <span className="whitespace-pre-wrap">{project.description}</span> : null}
        </p>
      </div>

      {canManageProject(project.role) ? (
        <div className="flex shrink-0 items-center gap-2">
          <EditProjectDialog project={project} />
          <DeleteProjectDialog project={project} />
        </div>
      ) : null}
    </header>
  )
}

/**
 * The workspace derives its project and role from `GET /projects` (the sidebar query) rather
 * than a `GET /projects/:projectId` call — see docs/phase-3-projects.md, Decision 1. That
 * means it renders "not found" for a project the caller is not a member of without a 403
 * round-trip, and rename never needs a second cache entry to invalidate.
 */
export function ProjectWorkspaceLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const { isPending, isError, error, refetch } = useProjects()
  const project = useProject(projectId).data

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <WorkspaceHeaderSkeleton />
        <Skeleton className="h-8 w-64" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="It may have been deleted, or you are not a member of it."
        action={
          <Link to="/projects" className="text-primary text-sm font-medium underline underline-offset-4">
            Back to projects
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader project={project} />
      <ProjectTabs />
      <Outlet />
    </div>
  )
}
