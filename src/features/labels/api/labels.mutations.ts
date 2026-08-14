import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { CreateLabelInput, UpdateLabelInput } from "@/features/labels/api/labels.api"
import { labelsApi, taskLabelsApi } from "@/features/labels/api/labels.api"
import { labelKeys, taskLabelKeys } from "@/features/labels/api/labels.keys"

export function useCreateLabel(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateLabelInput) => labelsApi.create(projectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: labelKeys.list(projectId) })
  })
}

/**
 * A rename or recolour changes every attached chip, so every open task's label list is
 * invalidated too — not just the definitions list.
 */
export function useUpdateLabel(labelId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateLabelInput) => labelsApi.update(labelId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: taskLabelKeys.lists() })
    }
  })
}

/** A hard delete cascades `TaskLabel`, so any open task's labels go stale too. */
export function useDeleteLabel(labelId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => labelsApi.remove(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: taskLabelKeys.lists() })
    }
  })
}

export function useAttachLabel(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (labelId: string) => taskLabelsApi.attach(taskId, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskLabelKeys.list(taskId) })
  })
}

export function useDetachLabel(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (labelId: string) => taskLabelsApi.detach(taskId, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskLabelKeys.list(taskId) })
  })
}
