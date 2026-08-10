import { queryOptions, useQuery } from "@tanstack/react-query"

import { projectsApi } from "@/features/projects/api/projects.api"
import { projectKeys } from "@/features/projects/api/projects.keys"
import type { ProjectSummary } from "@/types/api"

/**
 * Raw membership rows, unpaginated. The sidebar keeps this mounted for the whole signed-in
 * session, so every other project query (workspace header, role checks) reads the same cache
 * entry through a `select` instead of firing its own request.
 */
export const projectsQueryOptions = queryOptions({
  queryKey: projectKeys.lists(),
  queryFn: projectsApi.list
})

export function useProjects() {
  return useQuery({
    ...projectsQueryOptions,
    select: (memberships): ProjectSummary[] =>
      memberships
        .map(({ project, role }) => ({ ...project, role }))
        .sort((a, b) => a.name.localeCompare(b.name))
  })
}
