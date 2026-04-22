export interface RepoSearchResponse {
	items: Array<{
		id: number
		name: string
		full_name: string
		description: string | null
		private: boolean
		pushed_at: string
		updated_at: string
	}>
	total_count: number
}
