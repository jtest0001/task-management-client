import { apiClient } from "@/lib/api/client"
import { type TaskListQuery } from "@/features/tasks/lib/task-list-params"
import type { Paginated } from "@/types/api"

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

/**
 * The full task row. No `assignee` object and no `labels` — join `assigneeId` against the
 * members query for display (BE-5). `createdById` and `deletedAt` travel on every response but
 * this screen ignores both.
 */
export interface Task {
  id: string
  projectId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  dueDate: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
}

export type UpdateTaskInput = Partial<CreateTaskInput>

export const tasksApi = {
  list: async (projectId: string, query: TaskListQuery) =>
    (await apiClient.get<Paginated<Task>>(`/projects/${projectId}/tasks`, { params: query })).data,

  get: async (taskId: string) => (await apiClient.get<Task>(`/tasks/${taskId}`)).data,

  create: async (projectId: string, input: CreateTaskInput) =>
    (await apiClient.post<Task>(`/projects/${projectId}/tasks`, input)).data,

  update: async (taskId: string, input: UpdateTaskInput) =>
    (await apiClient.patch<Task>(`/tasks/${taskId}`, input)).data,

  remove: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`)
  }
}
