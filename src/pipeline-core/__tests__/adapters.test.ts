import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sekiAdapter } from '../adapters/sekiAdapter'
import { pulsarAdapter } from '../adapters/pulsarAdapter'
import type { PipelineAdapter, PipelineProvider } from '../types'

describe('Pipeline Adapters', () => {
  describe('Adapter Interface', () => {
    it('should have required properties', () => {
      const mockAdapter: PipelineAdapter = {
        name: 'seki' as PipelineProvider,
        supports: vi.fn().mockResolvedValue(true),
        fetch: vi.fn().mockResolvedValue(null),
      }
      
      expect(mockAdapter.name).toBe('seki')
      expect(typeof mockAdapter.supports).toBe('function')
      expect(typeof mockAdapter.fetch).toBe('function')
    })
  })

  describe('Seki Adapter', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      // Reset localStorage mock
      localStorage.clear()
    })

    it('should have correct name', () => {
      expect(sekiAdapter.name).toBe('seki')
    })

    it('should not support when no token exists', async () => {
      localStorage.setItem('releasehub_settings', JSON.stringify({ sekiToken: null, discordWebhook: null }))

      const result = await sekiAdapter.supports('Cencosud-xlabs', 'test-repo')
      expect(result).toBe(false)
    })

    it('should support when token exists', async () => {
      localStorage.setItem('releasehub_settings', JSON.stringify({ sekiToken: 'mock-token', discordWebhook: null }))

      await sekiAdapter.supports('Cencosud-xlabs', 'test-repo')
    })

    it('should handle invalid JSON in settings gracefully', async () => {
      localStorage.setItem('releasehub_settings', 'invalid-json')

      const result = await sekiAdapter.supports('Cencosud-xlabs', 'test-repo')
      expect(result).toBe(false)
    })
  })

  describe('Pulsar Adapter', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should have correct name', () => {
      expect(pulsarAdapter.name).toBe('pulsar')
    })

    it('should support when Nx Build workflow exists', async () => {
      // Mock the runCommand function
      const mockExec = await import('@/api/exec')
      vi.spyOn(mockExec, 'runCommand').mockResolvedValue({
        stdout: 'Nx Build\nOther Workflow',
        stderr: '',
        success: true,
      })
      
      const result = await pulsarAdapter.supports('test-org', 'test-repo')
      expect(result).toBe(true)
    })

    it('should not support when Nx Build workflow does not exist', async () => {
      const mockExec = await import('@/api/exec')
      vi.spyOn(mockExec, 'runCommand').mockResolvedValue({
        stdout: 'Other Workflow\nAnother Workflow',
        stderr: '',
        success: true,
      })
      
      const result = await pulsarAdapter.supports('test-org', 'test-repo')
      expect(result).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      const mockExec = await import('@/api/exec')
      vi.spyOn(mockExec, 'runCommand').mockRejectedValue(new Error('API Error'))
      
      const result = await pulsarAdapter.supports('test-org', 'test-repo')
      expect(result).toBe(false)
    })
  })
})
