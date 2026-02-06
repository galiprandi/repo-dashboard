import { useQuery } from '@tanstack/react-query'
import { listUserRepos } from '@/api/repos'
import type { RepoSearchResponse } from '@/api/repo-search.type'

interface UseUserReposOptions {
  org?: string
  enabled?: boolean
}

/**
 * Hook to list all repositories for the authenticated user
 * Uses gh CLI on the backend - returns empty array if gh not configured
 */
export function useUserRepos({ org = 'Cencosud-xlabs', enabled = true }: UseUserReposOptions = {}) {
  return useQuery<RepoSearchResponse>({
    queryKey: ['repos', 'list', org],
    queryFn: async () => {
      const result = await listUserRepos(org)
      return result
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    placeholderData: (previousData) => previousData,
  })
}
