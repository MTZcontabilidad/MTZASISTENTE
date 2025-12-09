/**
 * Componente para verificación de teléfono con código OTP
 * Usa Supabase Auth para enviar y verificar códigos
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './PhoneVerification.css'

interface PhoneVerificationProps {
  phone: string
  onVerified: (phone: string) => void
  onCancel?: () => void
}

export default function PhoneVerification({ phone, onVerified, onCancel }: PhoneVerificationProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Enviar código OTP
  const sendCode = async () => {
    try {
      setLoading(true)
      setError(null)

      // Formatear teléfono (agregar código de país si no tiene)
      const formattedPhone = formatPhone(phone)

      // Enviar OTP usando Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms' // o 'whatsapp' si está configurado
        }
      })

      if (otpError) {
        // Si falla SMS, intentar con email como alternativa
        console.warn('Error al enviar SMS, intentando con email:', otpError)
        // Por ahora, mostrar error pero permitir continuar
        setError('No se pudo enviar el código por SMS. Verifica que el número sea válido.')
        return
      }

      setCodeSent(true)
      setResendCooldown(60) // 60 segundos de cooldown

      // Contador regresivo
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      console.error('Error al enviar código:', err)
      setError('Error al enviar código. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Verificar código OTP
  const verifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      setError('Por favor ingresa el código de 6 dígitos')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formattedPhone = formatPhone(phone)

      // Verificar código OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code.trim(),
        type: 'sms'
      })

      if (verifyError) {
        setError('Código incorrecto. Por favor verifica e intenta de nuevo.')
        return
      }

      if (data?.user) {
        // Código verificado correctamente
        onVerified(formattedPhone)
      }
    } catch (err: any) {
      console.error('Error al verificar código:', err)
      setError('Error al verificar código. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Formatear teléfono con código de país
  const formatPhone = (phoneNumber: string): string => {
    // Remover espacios y caracteres especiales
    let cleaned = phoneNumber.replace(/\D/g, '')
    
    // Si no empieza con código de país, agregar +56 (Chile)
    if (!cleaned.startsWith('56')) {
      cleaned = '56' + cleaned
    }
    
    // Agregar el + al inicio
    return '+' + cleaned
  }

  // Auto-enviar código al montar
  useEffect(() => {
    if (!codeSent && phone) {
      sendCode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="phone-verification-overlay">
      <div className="phone-verification-modal">
        <div className="phone-verification-header">
          <h3>📱 Verificar Teléfono</h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="phone-verification-close"
              aria-label="Cerrar"
            >
              ✕
            </button>
          )}
        </div>

        <div className="phone-verification-content">
          <p className="phone-verification-description">
            Hemos enviado un código de verificación al número:
          </p>
          <p className="phone-verification-phone">{phone}</p>

          {!codeSent ? (
            <div className="phone-verification-sending">
              <div className="spinner"></div>
              <p>Enviando código...</p>
            </div>
          ) : (
            <>
              <div className="phone-verification-input-group">
                <label htmlFor="verification-code">Código de verificación (6 dígitos)</label>
                <input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCode(value)
                    setError(null)
                  }}
                  className="phone-verification-code-input"
                  placeholder="000000"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="phone-verification-error">
                  {error}
                </div>
              )}

              <div className="phone-verification-actions">
                <button
                  onClick={verifyCode}
                  disabled={loading || code.length !== 6}
                  className="phone-verification-button primary"
                >
                  {loading ? (
                    <>
                      <div className="spinner small"></div>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    'Verificar Código'
                  )}
                </button>

                <button
                  onClick={sendCode}
                  disabled={loading || resendCooldown > 0}
                  className="phone-verification-button secondary"
                >
                  {resendCooldown > 0
                    ? `Reenviar código (${resendCooldown}s)`
                    : 'Reenviar código'}
                </button>
              </div>
            </>
          )}

          <p className="phone-verification-note">
            💡 El código puede tardar unos segundos en llegar. Si no lo recibes, verifica que el número sea correcto.
          </p>
        </div>
      </div>
    </div>
  )
}

