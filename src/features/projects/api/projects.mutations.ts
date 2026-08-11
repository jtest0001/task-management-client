import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { CreateProjectInput } from "@/features/projects/api/projects.api"
import { projectsApi } from "@/features/projects/api/projects.api"
import { projectKeys } from "@/features/projects/api/projects.keys"

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
  })
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Partial<CreateProjectInput>) => projectsApi.update(projectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
  })
}

export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
  })
}
