import axios from 'axios'

const apiExec = axios.create({
  baseURL: '/api/exec',
})

interface ExecResponse {
  stdout: string
  stderr: string
}

/**
 * Execute a git command via Vite dev server
 * Only commands starting with 'git ' are allowed
 * @param command - Git command to execute (e.g., 'git log --oneline -5')
 * @returns Promise with stdout and stderr
 */
export const execGitCommand = async (command: string): Promise<ExecResponse> => {
  const response = await apiExec.post<ExecResponse>(
    '',
    { command },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  return response.data
}
