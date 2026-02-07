import { useQuery } from '@tanstack/react-query'
import { runCommand } from '@/api/exec'

// Type definitions at EOF
interface ParamsDTO {
  org?: string
  enabled?: boolean
}

interface CmdResponseDTO {
  name: string
  description: string
  pushedAt: string
}

// Legacy type for compatibility
interface RepoSearchResponse {
  results: Array<{
    fullName: string
    name: string
    description: string
    updatedAt: string
  }>
}

interface UseUserReposOptions extends ParamsDTO {
  org?: string
  enabled?: boolean
}

/**
 * Hook to list all repositories for the authenticated user
 * Uses gh CLI on the backend - returns empty array if gh not configured
 */
export function useUserRepos({
  org = 'Cencosud-xlabs',
  enabled = true,
}: UseUserReposOptions = {}) {
  // Command constant for listing repositories
  const REPO_LIST_CMD = `gh repo list ${org} --limit 1000 --json name,description,pushedAt`

  return useQuery<RepoSearchResponse>({
    queryKey: ['user', 'repos', org],
    queryFn: async () => {
      const result = await runCommand(REPO_LIST_CMD)
      const repos = JSON.parse(result.stdout) as CmdResponseDTO[]

      return {
        results: repos.map((repo) => ({
          fullName: `${org}/${repo.name}`,
          name: repo.name,
          description: repo.description || '',
          updatedAt: repo.pushedAt,
        })),
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
