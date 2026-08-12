import { UserAvatar } from "@/components/user-avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import { MemberRoleSelect } from "@/features/members/components/member-role-select"
import { RemoveMemberDialog } from "@/features/members/components/remove-member-dialog"
import { canChangeMemberRole, canRemoveMember } from "@/features/projects/lib/capabilities"
import { formatDueDate } from "@/lib/utils/date"
import { cn } from "@/lib/utils"
import type { Member } from "@/features/members/api/members.api"
import type { ProjectRole } from "@/types/api"

const COLUMNS = ["Member", "Role", "Joined", ""]
const ROLE_ORDER: Record<ProjectRole, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2 }

function sortMembers(members: Member[]) {
  return [...members].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.user.email.localeCompare(b.user.email)
  )
}

export function MembersTableSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

function RoleBadge({ role }: { role: ProjectRole }) {
  return (
    <span
      className={cn(
        "text-muted-foreground bg-secondary rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide",
        role === "OWNER" && "bg-accent text-accent-foreground"
      )}
    >
      {role}
    </span>
  )
}

export function MembersTable({ projectId, role, members }: { projectId: string; role: ProjectRole; members: Member[] }) {
  const { user } = useAuth()
  const ordered = sortMembers(members)

  return (
    <div className="table-scroll border-border bg-card overflow-x-auto rounded-xl border shadow-xs">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Members</caption>
        <thead>
          <tr className="bg-muted/50">
            {COLUMNS.map((col) => (
              <th
                key={col}
                scope="col"
                className="text-muted-foreground border-border border-t px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordered.map((member) => (
            <tr key={member.user.id} className="hover:bg-muted/50">
              <td className="border-border border-t px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <UserAvatar email={member.user.email} />
                  <span className="text-sm">{member.user.email}</span>
                  {member.user.id === user?.id && (
                    <span className="text-muted-foreground text-xs">(You)</span>
                  )}
                </div>
              </td>
              <td className="border-border border-t px-3 py-2.5">
                {canChangeMemberRole(role, member.role) ? (
                  <MemberRoleSelect projectId={projectId} member={member} />
                ) : (
                  <RoleBadge role={member.role} />
                )}
              </td>
              <td className="border-border border-t px-3 py-2.5">
                <span className="text-sm">{formatDueDate(member.joinedAt)}</span>
              </td>
              <td className="border-border border-t px-3 py-2.5">
                {canRemoveMember(role, member.role) && <RemoveMemberDialog projectId={projectId} member={member} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
