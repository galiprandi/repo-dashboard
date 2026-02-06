import axios from 'axios'
import type { RepoSearchResponse } from './repo-search.type'

const apiRepoSearch = axios.create({
  baseURL: '/api/repos',
})

/**
 * Search repositories with autocomplete support
 * @param query - Search query (at least 2 characters)
 * @param org - Organization to search in (default: Cencosud-xlabs)
 * @returns Promise<RepoSearchResponse> - List of matching repositories
 */
export const searchRepos = async (
  query: string,
  org: string = 'Cencosud-xlabs'
): Promise<RepoSearchResponse> => {
  const response = await apiRepoSearch.get<RepoSearchResponse>('/search', {
    params: { q: query, org },
  })
  return response.data
}
