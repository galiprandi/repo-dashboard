export interface Pipeline {
  id: string
  name: string
  description?: string
  status: string
  created_at: string
  updated_at: string
  // Add more fields as needed based on actual API response
}

export interface Product {
  id: string
  name: string
  organization: string
  project: string
  pipelines: Pipeline[]
  // Add more fields as needed based on actual API response
}
