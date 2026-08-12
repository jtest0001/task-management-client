import { useQuery } from "@tanstack/react-query"

import { commentsApi } from "@/features/comments/api/comments.api"
import { commentKeys } from "@/features/comments/api/comments.keys"

export function useComments(taskId: string) {
  return useQuery({ queryKey: commentKeys.list(taskId), queryFn: () => commentsApi.list(taskId) })
}
