import { useQuery } from '@tanstack/react-query'
import { listPipelines } from '@/api/seki'
import type { PipelineStatusResponse } from '@/api/seki.type'

interface UsePipelinesOptions {
  product: string
  limit?: number
  enabled?: boolean
}

export function usePipelines({
  product,
  limit = 50,
  enabled = true,
}: UsePipelinesOptions) {
  return useQuery<PipelineStatusResponse[]>({
    queryKey: ['pipelines', product, { limit }],
    queryFn: async () => {
      const response = await listPipelines(product, { limit })
      return response.data.items
    },
    enabled: enabled && !!product,
    placeholderData: (previousData) => previousData,
  })
}
