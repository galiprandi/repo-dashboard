import { useQuery } from '@tanstack/react-query'
import { searchRepos } from '@/api/repo-search'
import type { RepoSearchResponse } from '@/api/repo-search.type'

interface UseRepoSearchOptions {
  query: string
  org?: string
  enabled?: boolean
}

export function useRepoSearch({ query, org = 'Cencosud-xlabs', enabled = true }: UseRepoSearchOptions) {
  return useQuery<RepoSearchResponse>({
    queryKey: ['repo-search', query, org],
    queryFn: async () => {
      const result = await searchRepos(query, org)
      return result
    },
    enabled: enabled && query.length >= 2,
    placeholderData: (previousData) => previousData,
  })
}
