export interface RepoSearchResult {
  fullName: string
  name: string
  description: string
  updatedAt: string
}

export interface RepoSearchResponse {
  results: RepoSearchResult[]
  error?: string
}
