import { useQuery } from "@tanstack/react-query"

import { labelsApi, taskLabelsApi } from "@/features/labels/api/labels.api"
import { labelKeys, taskLabelKeys } from "@/features/labels/api/labels.keys"

export function useLabels(projectId: string | undefined) {
  return useQuery({
    queryKey: labelKeys.list(projectId ?? ""),
    queryFn: () => labelsApi.list(projectId ?? ""),
    enabled: Boolean(projectId)
  })
}

export function useTaskLabels(taskId: string | undefined) {
  return useQuery({
    queryKey: taskLabelKeys.list(taskId ?? ""),
    queryFn: () => taskLabelsApi.list(taskId ?? ""),
    enabled: Boolean(taskId)
  })
}
