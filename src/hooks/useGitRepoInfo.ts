import { useQuery } from '@tanstack/react-query'
import { fetchGitRepoInfo } from '@/api/git'
import type { GitRepoInfo } from '@/api/git.type'

interface UseGitRepoInfoOptions {
  repo: string
  enabled?: boolean
}

export function useGitRepoInfo({ repo, enabled = true }: UseGitRepoInfoOptions) {
  return useQuery<GitRepoInfo>({
    queryKey: ['git', repo],
    queryFn: async () => {
      const result = await fetchGitRepoInfo(repo)
      return result
    },
    enabled: enabled && !!repo,
    placeholderData: (previousData) => previousData,
  })
}
