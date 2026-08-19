import { BusyRegion } from "@/components/busy-region"
import { ScrollableTableRegion } from "@/components/scrollable-table-region"
import { UserAvatar } from "@/components/user-avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
    <BusyRegion label="Loading members" className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </BusyRegion>
  )
}

interface RoleBadgeProps {
  role: ProjectRole
}

function RoleBadge({ role }: RoleBadgeProps) {
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

interface MembersTableProps {
  projectId: string
  role: ProjectRole
  members: Member[]
  onMemberRemoved?: () => void
}

export function MembersTable({ projectId, role, members, onMemberRemoved }: MembersTableProps) {
  const { user } = useAuth()
  const ordered = sortMembers(members)

  return (
    <ScrollableTableRegion label="Members">
      <Table unwrapped>
        <caption className="sr-only">Members</caption>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {COLUMNS.map((col) => (
              <TableHead key={col} className="text-muted-foreground px-3 py-2.5">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordered.map((member) => (
            <TableRow key={member.user.id}>
              <TableCell className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <UserAvatar email={member.user.email} />
                  <span className="text-sm">{member.user.email}</span>
                  {member.user.id === user?.id && (
                    <span className="text-muted-foreground text-xs">(You)</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-3 py-2.5">
                {canChangeMemberRole(role, member.role) ? (
                  <MemberRoleSelect projectId={projectId} member={member} />
                ) : (
                  <RoleBadge role={member.role} />
                )}
              </TableCell>
              <TableCell className="px-3 py-2.5">
                <span className="text-sm">{formatDueDate(member.joinedAt)}</span>
              </TableCell>
              <TableCell className="px-3 py-2.5">
                {canRemoveMember(role, member.role) && (
                  <RemoveMemberDialog projectId={projectId} member={member} onRemoved={onMemberRemoved} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollableTableRegion>
  )
}
