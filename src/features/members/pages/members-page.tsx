import { useParams } from "react-router"

import { ErrorState } from "@/components/error-state"
import { AddMemberForm } from "@/features/members/components/add-member-form"
import { MembersTable, MembersTableSkeleton } from "@/features/members/components/members-table"
import { useMembers } from "@/features/members/api/members.queries"
import { useProject } from "@/features/projects/api/projects.queries"
import { canAddMembersToProject } from "@/features/projects/lib/capabilities"

export function MembersPage() {
  const { projectId } = useParams<{ projectId: string }>()
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
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Members</h2>
        {members ? (
          <p className="text-muted-foreground text-sm">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        ) : null}
      </div>

      {projectId && canAddMembersToProject(role) && <AddMemberForm projectId={projectId} />}

      {isProjectError ? (
        <ErrorState error={projectError} onRetry={() => refetchProject()} />
      ) : (
        <>
          {(isProjectPending || isMembersPending) && <MembersTableSkeleton />}
          {isError && <ErrorState error={error} onRetry={() => refetch()} />}
          {!isProjectPending && !isMembersPending && !isError && members && projectId && role ? (
            <>
              <MembersTable projectId={projectId} role={role} members={members} />
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
