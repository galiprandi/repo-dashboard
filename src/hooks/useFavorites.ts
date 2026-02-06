import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'seki:favorites:v1'

function getInitialFavorites(): string[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(getInitialFavorites)

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  const addFavorite = useCallback((product: string) => {
    setFavorites((prev) => {
      if (prev.includes(product)) return prev
      return [...prev, product]
    })
  }, [])

  const removeFavorite = useCallback((product: string) => {
    setFavorites((prev) => prev.filter((p) => p !== product))
  }, [])

  const toggleFavorite = useCallback((product: string) => {
    setFavorites((prev) => {
      if (prev.includes(product)) {
        return prev.filter((p) => p !== product)
      }
      return [...prev, product]
    })
  }, [])

  const isFavorite = useCallback(
    (product: string) => favorites.includes(product),
    [favorites]
  )

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  }
}
