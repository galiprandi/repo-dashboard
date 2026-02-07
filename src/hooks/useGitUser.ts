import { useQuery } from '@tanstack/react-query'
import { runCommand } from '@/api/exec'

interface GitUser {
  name: string | null
  email: string | null
}

export function useGitUser() {
  // Command constants for git user info
  const GIT_NAME_CMD = 'git config user.name'
  const GIT_EMAIL_CMD = 'git config user.email'

  return useQuery<GitUser>({
    queryKey: ['git', 'user', GIT_NAME_CMD, GIT_EMAIL_CMD],
    queryFn: async () => {
      const [nameResult, emailResult] = await Promise.all([
        runCommand(GIT_NAME_CMD),
        runCommand(GIT_EMAIL_CMD),
      ])

      return {
        name: nameResult.stdout.trim() || null,
        email: emailResult.stdout.trim() || null,
      }
    },
  })
}
