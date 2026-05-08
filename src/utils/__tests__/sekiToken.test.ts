import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hasSekiToken, getSekiToken } from '../sekiToken'

describe('sekiToken utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('hasSekiToken', () => {
    it('retorna true si el token existe', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{"sekiToken":"t"}')
      expect(hasSekiToken()).toBe(true)
    })

    it('retorna false si storage es nulo o JSON inválido', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      expect(hasSekiToken()).toBe(false)
      vi.mocked(localStorage.getItem).mockReturnValue('invalid')
      expect(hasSekiToken()).toBe(false)
    })

    it('retorna false si sekiToken es nulo o no existe', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{}')
      expect(hasSekiToken()).toBe(false)
      vi.mocked(localStorage.getItem).mockReturnValue('{"sekiToken":null}')
      expect(hasSekiToken()).toBe(false)
    })
  })

  describe('getSekiToken', () => {
    it('retorna el token string o null', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{"sekiToken":"abc"}')
      expect(getSekiToken()).toBe('abc')
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      expect(getSekiToken()).toBeNull()
      vi.mocked(localStorage.getItem).mockReturnValue('{"sekiToken":""}')
      expect(getSekiToken()).toBeNull()
      vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error() })
      expect(getSekiToken()).toBeNull()
    })
  })
})
