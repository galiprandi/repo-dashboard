import axios from 'axios'
import type { RepoSearchResponse } from './repo-search.type'

const apiRepos = axios.create({
  baseURL: '/api/repos',
})

/**
 * List all repositories for the authenticated user via gh CLI
 * Returns empty array if gh is not configured
 * @param org - Organization to list repos from (default: Cencosud-xlabs)
 * @returns Promise<RepoSearchResponse> - List of all accessible repositories
 */
export const listUserRepos = async (
  org: string = 'Cencosud-xlabs'
): Promise<RepoSearchResponse> => {
  const response = await apiRepos.get<RepoSearchResponse>('/list', {
    params: { org },
  })
  return response.data
}
