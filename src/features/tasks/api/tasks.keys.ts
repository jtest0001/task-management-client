import type { TaskListQuery } from "@/features/tasks/lib/task-list-params"

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  listsForProject: (projectId: string) => [...taskKeys.lists(), projectId] as const,
  list: (projectId: string, query: TaskListQuery) => [...taskKeys.listsForProject(projectId), query] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (taskId: string) => [...taskKeys.details(), taskId] as const
}
