import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface GitTag {
  name: string
  commit: string
  date: string
}

interface UseGitTagsOptions {
  repo: string
  limit?: number
  enabled?: boolean
}

export function useGitTags({
  repo,
  limit = 15,
  enabled = true,
}: UseGitTagsOptions) {
  const { data: tags, ...rest } = useQuery<GitTag[]>({
    queryKey: ['git', 'tags', repo, limit],
    queryFn: async () => {
      const command = `gh api repos/${repo}/tags --paginate --jq '.[] | {name: .name, commit: .commit.sha, date: .commit.committer.date}'`
      const response = await axios.post('/api/exec', { command })

      const lines = response.data.stdout
        .trim()
        .split('\n')
        .filter((line: string) => line && line.startsWith('{'))
      const allTags = lines
        .map((line: string) => {
          try {
            return JSON.parse(line)
          } catch {
            return null
          }
        })
        .filter(Boolean)

      return allTags
        .sort(
          (a: GitTag, b: GitTag) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        )
        .slice(0, limit)
    },
    enabled: enabled && !!repo,
    staleTime: 5 * 60 * 1000,
  })

  const latestTag = tags?.[0]

  return { tags, latestTag, ...rest }
}
