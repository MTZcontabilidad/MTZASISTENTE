// Caché de sesión para evitar recargas innecesarias al cambiar de pestaña

interface CachedSession {
  user: {
    id: string
    email: string
    role: string
    user_type?: string
  }
  timestamp: number
  expiresAt: number
}

const SESSION_CACHE_KEY = 'mtz_asistente_session'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutos (aumentado para evitar verificaciones frecuentes)

export const sessionCache = {
  set: (user: CachedSession['user']) => {
    try {
      const cached: CachedSession = {
        user,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      }
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cached))
    } catch (error) {
      console.warn('Error al guardar caché de sesión:', error)
    }
  },

  get: (): CachedSession['user'] | null => {
    try {
      const cachedStr = sessionStorage.getItem(SESSION_CACHE_KEY)
      if (!cachedStr) return null

      const cached: CachedSession = JSON.parse(cachedStr)
      
      // Verificar si el caché expiró
      if (Date.now() > cached.expiresAt) {
        sessionStorage.removeItem(SESSION_CACHE_KEY)
        return null
      }

      return cached.user
    } catch (error) {
      console.warn('Error al leer caché de sesión:', error)
      return null
    }
  },

  clear: () => {
    try {
      sessionStorage.removeItem(SESSION_CACHE_KEY)
    } catch (error) {
      console.warn('Error al limpiar caché de sesión:', error)
    }
  },

  isValid: (): boolean => {
    try {
      const cachedStr = sessionStorage.getItem(SESSION_CACHE_KEY)
      if (!cachedStr) return false

      const cached: CachedSession = JSON.parse(cachedStr)
      return Date.now() <= cached.expiresAt
    } catch {
      return false
    }
  }
}
