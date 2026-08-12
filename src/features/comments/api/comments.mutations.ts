import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { CreateCommentInput, UpdateCommentInput } from "@/features/comments/api/comments.api"
import { commentsApi } from "@/features/comments/api/comments.api"
import { commentKeys } from "@/features/comments/api/comments.keys"

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCommentInput) => commentsApi.create(taskId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) })
  })
}

export function useUpdateComment(commentId: string, taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCommentInput) => commentsApi.update(commentId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) })
  })
}

export function useDeleteComment(commentId: string, taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => commentsApi.remove(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) })
  })
}
