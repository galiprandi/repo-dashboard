/**
 * Helper functions for Seki token management
 */

/**
 * Check if a Seki token exists in releasehub_settings
 * @returns true if token exists, false otherwise
 */
export function hasSekiToken(): boolean {
  try {
    const settings = localStorage.getItem('releasehub_settings')
    if (!settings) return false

    const parsed = JSON.parse(settings) as { sekiToken: string | null }
    return !!parsed.sekiToken
  } catch {
    return false
  }
}

/**
 * Get the Seki token from releasehub_settings
 * @returns token string or null if not found
 */
export function getSekiToken(): string | null {
  try {
    const settings = localStorage.getItem('releasehub_settings')
    if (!settings) return null

    const parsed = JSON.parse(settings) as { sekiToken: string | null }
    return parsed.sekiToken || null
  } catch {
    return null
  }
}
