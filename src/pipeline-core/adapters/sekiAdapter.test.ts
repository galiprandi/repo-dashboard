import { describe, it, expect, vi } from 'vitest'
import { sekiAdapter } from './sekiAdapter'
import * as sekiApi from '@/api/seki'

vi.mock('@/api/seki', () => ({ fetchPipeline: vi.fn(), fetchPipelineWithTag: vi.fn() }))

describe('sekiAdapter', () => {
  it('should fetch and transform commit data correctly', async () => {
    const mockData = { state: 'SUCCESS', created_at: '2025-01-01T10:00:00Z', git: { commit: 'abcdef123', commit_message: 'test', commit_author: 'Test', ref: 'v1' }, events: [] }
    vi.mocked(sekiApi.fetchPipeline).mockResolvedValue({ data: mockData } )
    const result = await sekiAdapter.fetch('org', 'repo', 'commits', 'abcdef1')
    expect(result?.state).toBe('COMPLETED')
    expect(result?.ref).toBe('abcdef1')
  })

  it('should return null if ref is too short', async () => {
    expect(await sekiAdapter.fetch('org', 'repo', 'commits', 'abc')).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(sekiApi.fetchPipeline).mockRejectedValue(new Error('API Error'))
    expect(await sekiAdapter.fetch('org', 'repo', 'commits', 'abcdef1')).toBeNull()
  })
})
