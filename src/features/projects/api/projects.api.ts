import { apiClient } from "@/lib/api/client"
import type { ProjectListItem, ProjectRole } from "@/types/api"

/** A membership row from `GET /projects` — a bare array, one row per project the caller is in. */
export interface ProjectMembership {
  userId: string
  projectId: string
  role: ProjectRole
  joinedAt: string
  project: ProjectListItem
}

export const projectsApi = {
  /** `findByUserId` has no `orderBy` — row order is undefined, sort client-side. */
  list: async () => (await apiClient.get<ProjectMembership[]>("/projects")).data
}
