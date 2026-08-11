import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { CreateTaskInput, UpdateTaskInput } from "@/features/tasks/api/tasks.api"
import { tasksApi } from "@/features/tasks/api/tasks.api"
import { taskKeys } from "@/features/tasks/api/tasks.keys"

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(projectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.listsForProject(projectId) })
  })
}

export function useUpdateTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateTaskInput) => tasksApi.update(taskId, input),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task)
      queryClient.invalidateQueries({ queryKey: taskKeys.listsForProject(projectId) })
    }
  })
}

export function useDeleteTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => tasksApi.remove(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.listsForProject(projectId) })
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) })
    }
  })
}
