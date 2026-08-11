import type { ProjectRole } from "@/types/api"

type Role = ProjectRole | undefined

/** PATCH / DELETE /projects/:id — OWNER only. */
export const canManageProject = (role: Role) => role === "OWNER"
export const canAddMembersToProject = (role: Role) => role === "OWNER" || role === "ADMIN"
