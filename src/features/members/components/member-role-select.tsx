import { toast } from "sonner"

import { NativeSelect } from "@/components/native-select"
import { useUpdateMemberRole } from "@/features/members/api/members.mutations"
import { toApiError } from "@/lib/api/errors"
import type { Member } from "@/features/members/api/members.api"

export function MemberRoleSelect({ projectId, member }: { projectId: string; member: Member }) {
  const updateMemberRole = useUpdateMemberRole(projectId)

  return (
    <div className="w-24">
      <NativeSelect
        aria-label={`Role for ${member.user.email}`}
        className="h-8 text-xs"
        value={member.role}
        disabled={updateMemberRole.isPending}
        onChange={(event) => {
          const role = event.target.value as "ADMIN" | "MEMBER"
          updateMemberRole.mutate(
            { userId: member.user.id, role },
            {
              onError: (error) => toast.error(toApiError(error).message)
            }
          )
        }}
      >
        <option value="ADMIN">ADMIN</option>
        <option value="MEMBER">MEMBER</option>
      </NativeSelect>
    </div>
  )
}
