import { useQuery } from '@tanstack/react-query'
import { fetchPipeline, fetchPipelineWithTag } from '@/api/seki'
import type { PipelineStatusResponse } from '@/api/seki.type'

interface UsePipelineOptions {
  /** Full product name in format "org/repo" */
  product: string
  /** Full 40-character commit hash (short 7-char hashes will not work) */
  commit: string
  enabled?: boolean
}

interface UsePipelineWithTagOptions {
  /** Full product name in format "org/repo" */
  product: string
  /** Full 40-character commit hash */
  commit: string
  /** Tag name (e.g., "v1.0.0") - required for production pipelines */
  tag: string
  enabled?: boolean
}

/**
 * Check if there are any running sub-events in the pipeline
 */
const hasRunningSubEvents = (data: PipelineStatusResponse | undefined): boolean => {
  if (!data?.events) return false
  return data.events.some(event =>
    event.subevents?.some(sub =>
      ['started', 'running'].includes(sub.state.toLowerCase())
    )
  )
}

/**
 * Fetches a single pipeline by product and commit hash.
 * ⚠️ Requires the full 40-character commit hash - short hashes (7 chars) will return 404.
 */
export function usePipeline({
  product,
  commit,
  enabled = true,
}: UsePipelineOptions) {
  console.log('[usePipeline] ===== START =====')
  console.log('[usePipeline] product:', product)
  console.log('[usePipeline] commit:', commit)
  console.log('[usePipeline] commit length:', commit?.length)
  console.log('[usePipeline] enabled:', enabled)

  return useQuery<PipelineStatusResponse>({
    queryKey: ['pipeline', product, commit],
    queryFn: async () => {
      console.log('[usePipeline] Fetching pipeline from API...')
      try {
        const { data } = await fetchPipeline(product, commit)
        console.log('[usePipeline] Data received:', data)
        return data
      } catch (error) {
        console.error('[usePipeline] Error fetching pipeline:', error)
        throw error
      }
    },
    enabled: enabled && !!product && !!commit,
    refetchInterval: (query) => {
      const data = query.state.data as PipelineStatusResponse | undefined
      const pipelineState = data?.state?.toLowerCase()
      const inProgressPipelineStates = ['started', 'in_progress', 'running', 'pending']

      // Polling si pipeline en progreso
      if (pipelineState && inProgressPipelineStates.includes(pipelineState)) {
        return 30000 // 30s para pipeline en progreso
      }

      // Polling si hay sub-eventos corriendo (más frecuente)
      if (hasRunningSubEvents(data)) {
        return 15000 // 15s para sub-eventos activos
      }

      return false // Sin polling si está quieto
    },
    staleTime: 5000, // Mantener datos frescos por 5s para evitar flick
  })
}

/**
 * Fetches a pipeline by product, commit hash AND tag name.
 * Used for production pipelines that require both identifiers.
 * URL format: /products/{product}/pipelines/{commit}/{tag}
 */
export function usePipelineWithTag({
  product,
  commit,
  tag,
  enabled = true,
}: UsePipelineWithTagOptions) {
  return useQuery<PipelineStatusResponse>({
    queryKey: ['pipeline', product, commit, tag],
    queryFn: async () => {
      const { data } = await fetchPipelineWithTag(product, commit, tag)
      return data
    },
    enabled: enabled && !!product && !!commit && !!tag,
    refetchInterval: (query) => {
      const data = query.state.data as PipelineStatusResponse | undefined
      const pipelineState = data?.state?.toLowerCase()
      const inProgressPipelineStates = ['started', 'in_progress', 'running', 'pending']

      // Polling si pipeline en progreso
      if (pipelineState && inProgressPipelineStates.includes(pipelineState)) {
        return 30000 // 30s para pipeline en progreso
      }

      // Polling si hay sub-eventos corriendo (más frecuente)
      if (hasRunningSubEvents(data)) {
        return 15000 // 15s para sub-eventos activos
      }

      return false // Sin polling si está quieto
    },
    staleTime: 5000, // Mantener datos frescos por 5s para evitar flick
  })
}
