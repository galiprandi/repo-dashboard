import axios from 'axios'
import type { GitRepoInfo } from './git.type'

const apiGit = axios.create({
  baseURL: '/api/git',
})

/**
 * Fetch commits and tags for a GitHub repository via Vite dev server
 * @param repo - Repository in format "organization/repo-name"
 * @returns Promise<GitRepoInfo> - List of commits and tags with dates
 */
export const fetchGitRepoInfo = async (repo: string): Promise<GitRepoInfo> => {
  const response = await apiGit.get<GitRepoInfo>('', {
    params: { repo }
  })
  return response.data
}
