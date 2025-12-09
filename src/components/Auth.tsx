import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Auth.css'

interface AuthProps {
  onAuthSuccess: () => void
}

function Auth({ onAuthSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false)

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2>Bienvenido a MTZ Asistente</h2>
        <p className="auth-subtitle">Inicia sesión con tu cuenta de Google para continuar</p>
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
        <p className="auth-note">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad
        </p>
      </div>
    </div>
  )
}

export default Auth

