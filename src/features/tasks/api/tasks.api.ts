import { apiClient } from "@/lib/api/client"
import { type TaskListQuery } from "@/features/tasks/lib/task-list-params"
import type { Paginated, TaskPriority, TaskStatus } from "@/types/api"

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

export const tasksApi = {
  list: async (projectId: string, query: TaskListQuery) =>
    (await apiClient.get<Paginated<Task>>(`/projects/${projectId}/tasks`, { params: query })).data
}
