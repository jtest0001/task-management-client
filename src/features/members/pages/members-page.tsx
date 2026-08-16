import { useRef } from "react"
import { useParams } from "react-router"

import { useRouteHeading } from "@/app/router/route-focus-context"
import { ErrorState } from "@/components/error-state"
import { AddMemberForm } from "@/features/members/components/add-member-form"
import { MembersTable, MembersTableSkeleton } from "@/features/members/components/members-table"
import { useMembers } from "@/features/members/api/members.queries"
import { useProject } from "@/features/projects/api/projects.queries"
import { canAddMembersToProject } from "@/features/projects/lib/capabilities"

export function MembersPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const registerRouteHeading = useRouteHeading<HTMLHeadingElement>()
  const {
    data: project,
    isPending: isProjectPending,
    isError: isProjectError,
    error: projectError,
    refetch: refetchProject
  } = useProject(projectId)
  const { data: members, isPending: isMembersPending, isError, error, refetch } = useMembers(projectId)

  const role = project?.role

  return (
    <div className="flex flex-col gap-4 px-6">
      {/* The active tab already says "Members", so this stays visually hidden most of the time —
          it's a landmark for screen readers and the focus target after a route change or after
          removing a member, since its trigger button unmounts along with the row. It reveals
          itself on focus so keyboard users get a visible indicator too, instead of focus
          silently landing on an invisible element. */}
      <h2
        ref={(el) => {
          headingRef.current = el
          registerRouteHeading(el)
        }}
        tabIndex={-1}
        className="sr-only text-sm font-semibold focus-visible:not-sr-only focus-visible:rounded-md focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none"
      >
        Members
      </h2>

      {projectId && canAddMembersToProject(role) && <AddMemberForm projectId={projectId} />}

      {isProjectError ? (
        <ErrorState error={projectError} onRetry={() => refetchProject()} />
      ) : (
        <>
          {(isProjectPending || isMembersPending) && <MembersTableSkeleton />}
          {isError && <ErrorState error={error} onRetry={() => refetch()} />}
          {!isProjectPending && !isMembersPending && !isError && members && projectId && role ? (
            <>
              <MembersTable
                projectId={projectId}
                role={role}
                members={members}
                onMemberRemoved={() => headingRef.current?.focus()}
              />
              {members.length === 1 &&
                (canAddMembersToProject(role) ? (
                  <p className="text-muted-foreground text-sm">
                    You're the only member here — add teammates above.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">You're the only member here.</p>
                ))}
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
