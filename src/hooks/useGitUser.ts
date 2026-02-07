import { useQuery } from '@tanstack/react-query'
import { execGitCommand } from '@/api/exec'

interface GitUser {
  name: string | null
  email: string | null
}

export function useGitUser() {
  return useQuery<GitUser>({
    queryKey: ['git', 'user'],
    queryFn: async () => {
      const [nameResult, emailResult] = await Promise.all([
        execGitCommand('git config user.name'),
        execGitCommand('git config user.email'),
      ])

      return {
        name: nameResult.stdout.trim() || null,
        email: emailResult.stdout.trim() || null,
      }
    },
  })
}
