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
    (await apiClient.get<Wrapped<Member>>(`/projects/${projectId}/members`)).data
}
