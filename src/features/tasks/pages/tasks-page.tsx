import { Outlet, useParams, useSearchParams } from "react-router"

import { ErrorState } from "@/components/error-state"
import { useMembers } from "@/features/members/api/members.queries"
import { useTaskList } from "@/features/tasks/api/tasks.queries"
import { TaskPagination } from "@/features/tasks/components/task-pagination"
import { TaskTable, TaskTableSkeleton } from "@/features/tasks/components/task-table"
import { TaskToolbar, type TaskFilterPatch } from "@/features/tasks/components/task-toolbar"
import { parseTaskListParams, toTaskListSearchParams } from "@/features/tasks/lib/task-list-params"

export function TasksPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = parseTaskListParams(searchParams)

  const { data: members, isPending: membersPending } = useMembers(projectId)
  const {
    data: tasks,
    isPending,
    isError,
    error,
    refetch,
    isPlaceholderData
  } = useTaskList(projectId ?? "", query)

  /** Any filter or sort change resets to page 1; a page change is its own navigation. */
  const applyFilters = (patch: TaskFilterPatch) => {
    setSearchParams(toTaskListSearchParams({ ...query, ...patch, page: 1 }), { replace: true })
  }

  const goToPage = (page: number) => {
    setSearchParams(toTaskListSearchParams({ ...query, page }))
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return (
    <div className="flex flex-col gap-4 px-6">
      {/* The active tab already says "Tasks" — this is a landmark for screen readers, not a
          visible heading. */}
      <h2 className="sr-only">Tasks</h2>

      <TaskToolbar
        query={query}
        members={members}
        membersPending={membersPending}
        onFilterChange={applyFilters}
      />

      {isPending && <TaskTableSkeleton />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isPending && !isError && tasks ? (
        <>
          <TaskTable
            tasks={tasks.data}
            page={tasks.pagination.page}
            query={query}
            members={members}
            membersPending={membersPending}
            isPlaceholderData={isPlaceholderData}
            search={searchParams.toString()}
            projectId={projectId ?? ""}
            onClearFilters={clearFilters}
            onBackToFirstPage={() => goToPage(1)}
          />
          {tasks.data.length > 0 && <TaskPagination pagination={tasks.pagination} onPageChange={goToPage} />}
        </>
      ) : null}

      <Outlet />
    </div>
  )
}
