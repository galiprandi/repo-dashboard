import { useQuery } from '@tanstack/react-query'
import { execGitCommand } from '@/api/exec'

export interface CommitDetails {
  hash: string
  shortHash: string
  author: string
  email: string
  date: string
  message: string
  subject: string
  body: string
  files: string[]
  stats?: {
    insertions: number
    deletions: number
    filesChanged: number
  }
}

interface UseCommitOptions {
  repo: string
  commitHash?: string
  enabled?: boolean
}

function parseCommitOutput(output: string): CommitDetails | null {
  if (!output.trim()) return null

  const lines = output.split('\n')
  
  let hash = ''
  let shortHash = ''
  let author = 'Unknown'
  let email = ''
  let date = ''
  let subject = ''
  let body = ''
  const files: string[] = []
  let inBody = false

  for (const line of lines) {
    if (line.startsWith('hash:')) {
      hash = line.replace('hash:', '').trim()
      shortHash = hash.slice(0, 7)
    } else if (line.startsWith('author:')) {
      author = line.replace('author:', '').trim()
    } else if (line.startsWith('email:')) {
      email = line.replace('email:', '').trim()
    } else if (line.startsWith('date:')) {
      date = line.replace('date:', '').trim()
    } else if (line.startsWith('subject:')) {
      subject = line.replace('subject:', '').trim()
      inBody = true
    } else if (line.startsWith('END')) {
      inBody = false
    } else if (inBody) {
      body += (body ? '\n' : '') + line
    }
  }

  return {
    hash,
    shortHash,
    author,
    email,
    date,
    message: subject + (body ? '\n\n' + body : ''),
    subject,
    body,
    files,
  }
}

export function useCommit({ repo, commitHash, enabled = true }: UseCommitOptions) {
  return useQuery<CommitDetails | null>({
    queryKey: ['commit', repo, commitHash],
    queryFn: async () => {
      if (!commitHash || !repo) return null

      try {
        // Get commit details using git show with custom format
        const { stdout: commitOutput } = await execGitCommand(
          `git -C /Users/cenco/Github/${repo} show --no-patch --format="hash:%H%nauthor:%an%nemail:%ae%ndate:%ai%nsubject:%s%nEND" ${commitHash}`
        )
        
        const details = parseCommitOutput(commitOutput)
        
        if (!details) return null

        // Get changed files
        const { stdout: filesOutput } = await execGitCommand(
          `git -C /Users/cenco/Github/${repo} diff-tree --no-commit-id --name-only -r ${commitHash}`
        )
        
        details.files = filesOutput
          .split('\n')
          .map(f => f.trim())
          .filter(f => f.length > 0)

        // Get stats
        const { stdout: statsOutput } = await execGitCommand(
          `git -C /Users/cenco/Github/${repo} show --stat --format="" ${commitHash}`
        )
        
        // Parse stats like "3 files changed, 42 insertions(+), 10 deletions(-)"
        const statsMatch = statsOutput.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/)
        if (statsMatch) {
          details.stats = {
            filesChanged: parseInt(statsMatch[1] || '0', 10),
            insertions: parseInt(statsMatch[2] || '0', 10),
            deletions: parseInt(statsMatch[3] || '0', 10),
          }
        }

        return details
      } catch (error) {
        console.error('Error fetching commit details:', error)
        return null
      }
    },
    enabled: enabled && !!commitHash && !!repo,
    placeholderData: (previousData) => previousData,
  })
}
