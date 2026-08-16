import { useRef } from "react"
import { Outlet, useParams, useSearchParams } from "react-router"

import { useRouteHeading } from "@/app/router/route-focus-context"
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
  const headingRef = useRef<HTMLHeadingElement>(null)
  const registerRouteHeading = useRouteHeading<HTMLHeadingElement>()

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

  // "Clear filters" and "Back to first page" both re-render the table out from under the
  // button that was just pressed — move focus to the heading instead of losing it to <body>.
  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
    headingRef.current?.focus()
  }

  const backToFirstPage = () => {
    setSearchParams(toTaskListSearchParams({ ...query, page: 1 }))
    headingRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-4 px-6">
      <h2
        ref={(el) => {
          headingRef.current = el
          registerRouteHeading(el)
        }}
        tabIndex={-1}
        className="focus-visible:ring-ring sr-only text-sm font-semibold focus-visible:not-sr-only focus-visible:rounded-md focus-visible:ring-3 focus-visible:outline-none"
      >
        Tasks
      </h2>

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
            onBackToFirstPage={backToFirstPage}
          />
          <TaskPagination pagination={tasks.pagination} onPageChange={goToPage} />
        </>
      ) : null}

      <Outlet />
    </div>
  )
}
