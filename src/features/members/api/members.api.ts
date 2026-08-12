import { apiClient } from "@/lib/api/client"
import type { ProjectRole, UserSummary, Wrapped } from "@/types/api"

/** A row from `GET /projects/:projectId/members` — no `id` on the member itself. */
export interface Member {
  role: ProjectRole
  joinedAt: string
  user: UserSummary
}

export const membersApi = {
  list: async (projectId: string) =>
    (await apiClient.get<Wrapped<Member>>(`/projects/${projectId}/members`)).data,

  add: async (projectId: string, email: string) =>
    (await apiClient.post<Member>(`/projects/${projectId}/members`, { email })).data,

  updateRole: async (projectId: string, userId: string, role: "ADMIN" | "MEMBER") =>
    (await apiClient.patch<Member>(`/projects/${projectId}/members/${userId}`, { role })).data,

  remove: async (projectId: string, userId: string) => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`)
  }
}
