import { apiClient } from "@/lib/api/client"
import type { ProjectRole } from "@/types/api"

/** The 5-field select nested in `GET /projects` — not a whole `Project` row. */
export interface ProjectListItem {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: string
}

/** A membership row from `GET /projects` — a bare array, one row per project the caller is in. */
export interface ProjectMembership {
  userId: string
  projectId: string
  role: ProjectRole
  joinedAt: string
  project: ProjectListItem
}

/** `POST` / `PATCH /projects` return the raw row — distinct from the 5-field select above. */
export interface Project extends ProjectListItem {
  updatedAt: string
  deletedAt: string | null
}

/** Flattened view of a `GET /projects` row: the project plus the caller's role in it. */
export type ProjectSummary = ProjectListItem & { role: ProjectRole }

export interface CreateProjectInput {
  name: string
  description?: string
}

export const projectsApi = {
  /** `findByUserId` has no `orderBy` — row order is undefined, sort client-side. */
  list: async () => (await apiClient.get<ProjectMembership[]>("/projects")).data,
  create: async (input: CreateProjectInput) =>
    (await apiClient.post<Project>("/projects", input)).data,
  /** `UpdateProjectSchema` is `.partial().refine(...)` — rejects `{}`, never send an empty body. */
  update: async (projectId: string, input: Partial<CreateProjectInput>) =>
    (await apiClient.patch<Project>(`/projects/${projectId}`, input)).data,
  delete: async (projectId: string) => {
    await apiClient.delete(`/projects/${projectId}`)
  }
}
