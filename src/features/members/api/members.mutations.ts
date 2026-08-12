import { useMutation, useQueryClient } from "@tanstack/react-query"

import { membersApi } from "@/features/members/api/members.api"
import { memberKeys } from "@/features/members/api/members.keys"
import { taskKeys } from "@/features/tasks/api/tasks.keys"

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (email: string) => membersApi.add(projectId, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.list(projectId) })
  })
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "ADMIN" | "MEMBER" }) =>
      membersApi.updateRole(projectId, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.list(projectId) })
  })
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.listsForProject(projectId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.details() })
    }
  })
}
