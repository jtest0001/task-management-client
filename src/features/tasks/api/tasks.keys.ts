import type { TaskListQuery } from "@/features/tasks/lib/task-list-params"

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (projectId: string, query: TaskListQuery) => [...taskKeys.lists(), projectId, query] as const
}
