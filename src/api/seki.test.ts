import { describe, it, expect, vi } from 'vitest'
import { fetchLatestPipeline, apiSeki } from './seki'

vi.mock('@/utils/sekiToken', () => ({ getSekiToken: vi.fn() }))

describe('api/seki', () => {
  it('fetchLatestPipeline retorna el primer item y maneja filtros', async () => {
    const mockP = { id: '1' }
    const spy = vi.spyOn(apiSeki, 'get').mockResolvedValue({ data: { items: [mockP] } })

    const res = await fetchLatestPipeline('o/r', 'staging', 'commit')
    expect(res).toBe(mockP)
    expect(spy).toHaveBeenCalledWith('/products/o/r/pipelines', expect.objectContaining({
      params: expect.objectContaining({
        filters: { 'git.stage': 'staging', 'git.event': 'commit' }
      })
    }))
  })

  it('fetchLatestPipeline retorna null si no hay items', async () => {
    vi.spyOn(apiSeki, 'get').mockResolvedValue({ data: { items: [] } })
    const res = await fetchLatestPipeline('o/r', 'production')
    expect(res).toBeNull()
  })
})
