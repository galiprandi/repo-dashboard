import axios from 'axios'
import type { PipelineStatusResponse } from './seki.type'

export const apiSeki = axios.create({
  baseURL: '/api',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US',
    'Authorization': `bearer ${import.meta.env.VITE_SEKI_API_TOKEN}`,
  },
})

/**
 * Fetch pipeline status for specific commit
 */
export const fetchPipeline = (
  product: string, // organization/product
  commit: string
) => {
  return apiSeki.get<PipelineStatusResponse>(
    `/products/${product}/pipelines/${commit}`
  )
}

interface PipelinesListResponse {
  offset: number
  limit: number
  total: number
  items: PipelineStatusResponse[]
}

/**
 * List pipelines for a product with optional filters
 */
export const listPipelines = (
  product: string,
  params?: {
    limit?: number
    offset?: number
    filters?: Record<string, unknown>
    sort?: Record<string, 'asc' | 'desc'>
  }
) => {
  return apiSeki.get<PipelinesListResponse>(
    `/products/${product}/pipelines`,
    { params }
  )
}

/**
 * Fetch latest pipeline for a specific stage (staging/production)
 * Filters by git.stage and returns the most recent
 */
export const fetchLatestPipeline = async (
  product: string,
  stage: 'staging' | 'production',
  event?: 'commit' | 'tag'
) => {
  const filters: Record<string, unknown> = {
    'git.stage': stage,
  }
  if (event) {
    filters['git.event'] = event
  }

  const response = await listPipelines(product, {
    limit: 1,
    sort: { updated_at: 'desc' },
    filters,
  })

  if (response.data.items.length === 0) {
    return null
  }

  return response.data.items[0]
}
