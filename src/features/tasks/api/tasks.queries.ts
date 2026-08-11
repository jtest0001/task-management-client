import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { tasksApi } from "@/features/tasks/api/tasks.api"
import { taskKeys } from "@/features/tasks/api/tasks.keys"
import type { TaskListQuery } from "@/features/tasks/lib/task-list-params"

/** `keepPreviousData` so a filter/page change dims the current rows instead of blanking them. */
export function useTaskList(projectId: string, query: TaskListQuery) {
  return useQuery({
    queryKey: taskKeys.list(projectId, query),
    queryFn: () => tasksApi.list(projectId, query),
    placeholderData: keepPreviousData
  })
}
