import { useQuery } from '@tanstack/react-query'
import { fetchPipeline } from '@/api/seki'
import type { PipelineStatusResponse } from '@/api/seki.type'

interface UsePipelineOptions {
  product: string
  commit: string
  enabled?: boolean
}

export function usePipeline({ product, commit, enabled = true }: UsePipelineOptions) {
  return useQuery<PipelineStatusResponse>({
    queryKey: ['pipeline', product, commit],
    queryFn: async () => {
      const { data } = await fetchPipeline(product, commit)
      return data
    },
    enabled: enabled && !!product && !!commit,
  })
}
