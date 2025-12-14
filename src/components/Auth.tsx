import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Footer from './Footer'
import './Auth.css'

interface AuthProps {
  onAuthSuccess: () => void
  onGuestLogin?: (phone: string) => void
  onBackToDevMode?: () => void
  isFromDevMode?: boolean
}

function Auth({ onAuthSuccess, onGuestLogin, onBackToDevMode, isFromDevMode }: AuthProps) {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      
      // Obtener la URL correcta según el entorno
      // En desarrollo: usar localhost:5173 (puerto de Vite)
      // En producción: usar la URL actual (Vercel)
      const getRedirectUrl = () => {
        // En cualquier entorno, preferimos usar la URL actual del navegador
        // Esto funciona tanto para producción (Vercel) como desarrollo (localhost)
        // y evita hardcodes problemáticos
        const origin = window.location.origin;
        const pathname = window.location.pathname || '/';
        
        // Eliminar slash final si existe para evitar doble slash
        const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
        const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
        
        return `${cleanOrigin}${cleanPath}`;
      }
      
      const redirectUrl = getRedirectUrl()
      console.log('🔐 OAuth Redirect Configuration:')
      console.log('  - Current origin:', window.location.origin)
      console.log('  - Redirect URL:', redirectUrl)
      console.log('  - Is DEV mode:', import.meta.env.DEV)
      console.log('  - Is Production:', redirectUrl.includes('vercel.app') || redirectUrl.includes('vercel.com'))
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('Error al iniciar sesión:', error)
        alert('Error al iniciar sesión con Google')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <img 
              src="https://mtz-alpha.vercel.app/logo-mtz.png" 
              alt="MTZ Logo" 
              className="logo-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = '<div class="logo-fallback">MTZ</div>'
                }
              }}
            />
          </div>

          <h2>Bienvenido a MTZ Ouroborus AI</h2>
          <p className="auth-subtitle">Tu asistente virtual de MTZ</p>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="google-login-button"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          {isFromDevMode && onBackToDevMode && (
            <button
              onClick={onBackToDevMode}
              className="back-to-dev-mode-button"
            >
              ← Volver al modo desarrollo
            </button>
          )}

          <p className="auth-note">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad
          </p>
        </div>
      </div>
    </>
  )
}

export default Auth

