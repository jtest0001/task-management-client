import { Link } from "react-router"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog"
import { useProjects } from "@/features/projects/api/projects.queries"
import { formatDueDate } from "@/lib/utils/date"
import { cn } from "@/lib/utils"
import type { ProjectSummary } from "@/types/api"

function ProjectsGridSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <Skeleton className="h-32 w-full rounded-xl" />
        </li>
      ))}
    </ul>
  )
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      to={`/projects/${project.id}/tasks`}
      className="border-border bg-card focus-visible:ring-ring hover:bg-muted/50 flex h-full flex-col gap-2 rounded-xl border p-4 shadow-xs transition-colors focus-visible:ring-3 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{project.name}</span>
        <span
          className={cn(
            "text-muted-foreground bg-secondary shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide",
            project.role === "OWNER" && "bg-accent text-accent-foreground"
          )}
        >
          {project.role}
        </span>
      </div>
      {project.description ? (
        <p className="text-muted-foreground line-clamp-2 text-sm">{project.description}</p>
      ) : (
        <p className="text-muted-foreground text-sm italic">No description</p>
      )}
      <p className="text-muted-foreground mt-auto text-xs">Created {formatDueDate(project.createdAt)}</p>
    </Link>
  )
}

function ProjectsGrid({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create your first project to start organising work."
        action={<CreateProjectDialog />}
      />
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  )
}

export function ProjectsPage() {
  const { data: projects, isPending, isError, error, refetch } = useProjects()

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Projects</h1>

      {isPending && <ProjectsGridSkeleton />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isPending && !isError && <ProjectsGrid projects={projects} />}
    </div>
  )
}
