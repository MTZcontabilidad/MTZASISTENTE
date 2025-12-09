import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Footer from './Footer'
import './Auth.css'

interface AuthProps {
  onAuthSuccess: () => void
  onGuestLogin?: (phone: string) => void
}

function Auth({ onAuthSuccess, onGuestLogin }: AuthProps) {
  const [loading, setLoading] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [guestPhone, setGuestPhone] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)

  useEffect(() => {
    // Verificar si hay una sesión después del redirect de OAuth
    // Solo verificar una vez al montar el componente
    let mounted = true
    
    const checkSession = async () => {
      try {
        // Timeout para evitar espera infinita
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 2000)
        )
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any
        if (mounted && result?.data?.session) {
          console.log('Sesión encontrada después del redirect')
          onAuthSuccess()
        }
      } catch (error: any) {
        console.error('Error al verificar sesión en Auth:', error)
        // No hacer nada, dejar que el usuario intente iniciar sesión manualmente
      }
    }
    
    // Pequeño delay para asegurar que el redirect se complete
    const timeoutId = setTimeout(checkSession, 100)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, []) // Removido onAuthSuccess de dependencias para evitar loops

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      
      // Obtener la URL correcta según el entorno
      // En desarrollo: usar localhost:5173 (puerto de Vite)
      // En producción: usar la URL actual (Vercel)
      const getRedirectUrl = () => {
        const origin = window.location.origin
        const pathname = window.location.pathname || '/'
        
        // Detectar si estamos en producción (Vercel o cualquier dominio que no sea localhost)
        const isProduction = origin.includes('vercel.app') || 
                            origin.includes('vercel.com') ||
                            (!origin.includes('localhost') && 
                             !origin.includes('127.0.0.1') && 
                             !origin.includes('0.0.0.0'))
        
        // Si estamos en producción, SIEMPRE usar la URL actual
        if (isProduction) {
          return `${origin}${pathname}`
        }
        
        // Si estamos en desarrollo (localhost), usar localhost:5173
        // Verificar si el servidor está corriendo en el puerto actual
        const currentPort = window.location.port
        if (currentPort === '5173' || !currentPort) {
          return `${origin}${pathname}`
        }
        // Si estamos en otro puerto, usar 5173
        return `http://localhost:5173${pathname}`
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

  const handleGuestLogin = async () => {
    if (!guestPhone.trim()) {
      alert('Por favor ingresa tu número de teléfono')
      return
    }

    // Validar formato básico de teléfono
    const phoneRegex = /^[\d\s\-\+\(\)]{8,15}$/
    if (!phoneRegex.test(guestPhone.trim())) {
      alert('Por favor ingresa un número de teléfono válido')
      return
    }

    try {
      setGuestLoading(true)
      
      // Si hay callback, usarlo
      if (onGuestLogin) {
        onGuestLogin(guestPhone.trim())
        return
      }

      // Crear sesión de invitado anónima
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (error) throw error

      if (data?.user) {
        // Guardar teléfono en metadata o en una tabla temporal
        // Por ahora solo continuamos
        onAuthSuccess()
      }
    } catch (error: any) {
      console.error('Error en login de invitado:', error)
      alert('Error al ingresar como invitado. Por favor intenta de nuevo.')
    } finally {
      setGuestLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    // Remover todo excepto números
    const numbers = value.replace(/\D/g, '')
    // Limitar a 15 dígitos
    const limited = numbers.slice(0, 15)
    return limited
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setGuestPhone(formatted)
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

          {!showGuestForm ? (
            <>
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

              <div className="auth-divider">
                <span>o</span>
              </div>

              <button
                onClick={() => setShowGuestForm(true)}
                className="guest-login-button"
              >
                <span>Ingresar como Invitado / Prueba</span>
              </button>

              <p className="auth-note">
                Al continuar, aceptas nuestros términos de servicio y política de privacidad
              </p>
            </>
          ) : (
            <>
              <h3 className="guest-form-title">Ingreso como Invitado</h3>
              <p className="guest-form-subtitle">
                Ingresa tu número de teléfono para acceder al chat
              </p>
              
              <div className="guest-phone-input">
                <input
                  type="tel"
                  placeholder="Ej: 912345678"
                  value={guestPhone}
                  onChange={handlePhoneChange}
                  className="phone-input"
                  maxLength={15}
                  autoFocus
                />
              </div>

              <button
                onClick={handleGuestLogin}
                disabled={guestLoading || !guestPhone.trim()}
                className="guest-submit-button"
              >
                {guestLoading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <span>Ingresar al Chat</span>
                )}
              </button>

              <button
                onClick={() => {
                  setShowGuestForm(false)
                  setGuestPhone('')
                }}
                className="guest-back-button"
              >
                Volver
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Auth

