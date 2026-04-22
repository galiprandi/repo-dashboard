import { runCommand } from './exec'
import type { RepoSearchResponse } from './repo-search.type'

export async function searchRepos(query: string, org: string): Promise<RepoSearchResponse> {
	const result = await runCommand(`gh api search/repositories -q "${query} org:${org}" --json id,name,full_name,description,private,pushed_at,updated_at`)
	return JSON.parse(result.stdout)
}
