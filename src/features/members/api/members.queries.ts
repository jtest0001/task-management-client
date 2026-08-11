import { useQuery } from "@tanstack/react-query"

import { membersApi } from "@/features/members/api/members.api"
import { memberKeys } from "@/features/members/api/members.keys"

export function useMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: memberKeys.list(projectId ?? ""),
    queryFn: () => membersApi.list(projectId ?? ""),
    enabled: Boolean(projectId),
    select: (response) => [...response.data].sort((a, b) => a.user.email.localeCompare(b.user.email))
  })
}
