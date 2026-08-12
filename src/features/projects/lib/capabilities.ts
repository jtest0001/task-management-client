import type { ProjectRole } from "@/types/api"

type Role = ProjectRole | undefined

/** PATCH / DELETE /projects/:id — OWNER only. */
export const canManageProject = (role: Role) => role === "OWNER"
export const canAddMembersToProject = (role: Role) => role === "OWNER" || role === "ADMIN"

/** PATCH /projects/:id/members/:memberId — OWNER only, and never against an OWNER. */
export const canChangeMemberRole = (actor: Role, target: ProjectRole) => actor === "OWNER" && target !== "OWNER"

/** DELETE — OWNER removes ADMIN+MEMBER, ADMIN removes MEMBER, OWNER is never removable. */
export const canRemoveMember = (actor: Role, target: ProjectRole) =>
  target !== "OWNER" && (actor === "OWNER" || (actor === "ADMIN" && target === "MEMBER"))

/** POST/PATCH/DELETE /projects/:id/labels — OWNER/ADMIN only. Attach/detach has no role gate. */
export const canManageLabels = (role: Role) => role === "OWNER" || role === "ADMIN"
