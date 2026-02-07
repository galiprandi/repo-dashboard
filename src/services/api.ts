import type { Product } from '@/types/api'

const API_URL = import.meta.env.VITE_SEKI_API_URL
const API_TOKEN = import.meta.env.VITE_SEKI_API_TOKEN

class ApiError extends Error {
  status?: number
  response?: Response

  constructor(message: string, status?: number, response?: Response) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.response = response
  }
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers({
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US',
    Authorization: `bearer ${API_TOKEN}`,
    ...options.headers,
  })

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new ApiError(
      `HTTP error! status: ${response.status}`,
      response.status,
      response
    )
  }

  return response
}

export async function getProductPipeline(
  org: string,
  project: string,
  pipelineId: string
): Promise<Product> {
  const url = `${API_URL}/products/${org}/${project}/pipelines/${pipelineId}`
  const response = await fetchWithAuth(url)
  return response.json()
}

export async function getPipelines(
  org: string,
  project: string
): Promise<Product> {
  const url = `${API_URL}/products/${org}/${project}/pipelines`
  const response = await fetchWithAuth(url)
  return response.json()
}

export { ApiError }
