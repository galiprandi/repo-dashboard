export interface GitCommit {
  hash: string
  date: string
  message: string
  author: string
}

export interface GitTag {
  name: string
  commit: string
  date: string
}

export interface GitRepoInfo {
  commits: GitCommit[]
  tags: GitTag[]
}
