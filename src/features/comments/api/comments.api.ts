import { apiClient } from "@/lib/api/client"
import type { Paginated, UserSummary } from "@/types/api"

/** The backend's `commentSelect` — no `taskId`, `authorId` or `deletedAt`, unlike `Task`. */
export interface Comment {
  id: string
  content: string
  author: UserSummary
  createdAt: string
  updatedAt: string
}

export interface CreateCommentInput {
  content: string
}

export type UpdateCommentInput = CreateCommentInput

/** The API's maximum `limit`. See "Why one page" in docs/phase-6-comments.md. */
export const COMMENTS_PAGE_LIMIT = 100

export const commentsApi = {
  list: async (taskId: string) =>
    (
      await apiClient.get<Paginated<Comment>>(`/tasks/${taskId}/comments`, {
        params: { limit: COMMENTS_PAGE_LIMIT }
      })
    ).data,

  create: async (taskId: string, input: CreateCommentInput) =>
    (await apiClient.post<Comment>(`/tasks/${taskId}/comments`, input)).data,

  update: async (commentId: string, input: UpdateCommentInput) =>
    (await apiClient.patch<Comment>(`/comments/${commentId}`, input)).data,

  remove: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`)
  }
}
