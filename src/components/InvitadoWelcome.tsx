import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { MTZ_SERVICES } from '../config/services'
import { getWhatsAppLink, openLink } from '../config/links'
import { UserRole, UserType } from '../types'
import './InvitadoWelcome.css'

interface InvitadoWelcomeProps {
  user: {
    id: string
    email: string
    role: UserRole
    user_type?: UserType
  }
  onContinue: () => void
}

function InvitadoWelcome({ user, onContinue }: InvitadoWelcomeProps) {
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartChat = async () => {
    if (!phone.trim()) {
      setError('Por favor ingresa un número de teléfono válido')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Solo actualizamos el teléfono para contacto. IMPORTANTE: NO cambiamos el rol.
      // El rol se mantiene 'invitado' hasta que un Admin lo cambie.
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ phone: phone.trim() })
        .eq('id', user.id)

      if (profileError) {
        console.error('Error al actualizar perfil:', profileError)
        // Si falla, intentamos continuar de todos modos, no bloqueamos
      }

      // Crear/Actualizar client_info básico solo con teléfono
      const { data: existing } = await supabase
        .from('client_info')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('client_info').insert({
          user_id: user.id,
          phone: phone.trim()
        })
      } else {
        await supabase.from('client_info').update({
          phone: phone.trim()
        }).eq('user_id', user.id)
      }

      // Continuar a Arise (chat)
      onContinue()
    } catch (error: any) {
      console.error('Error al guardar información:', error)
      setError('Hubo un pequeño error de conexión, pero intentaremos continuar.')
      // En caso de error, dejamos pasar igual para no bloquear
      setTimeout(onContinue, 1000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="invitado-welcome">
      <div className="welcome-container">
        <div className="welcome-header">
          <h1 className="welcome-title">¡Bienvenido a Arise!</h1>
          <p className="welcome-subtitle">
            Tu asistente virtual de MTZ. Para ofrecerte una mejor atención, necesitamos tu número de contacto.
          </p>
        </div>

        <div className="welcome-form">
          
          {/* Formulario de teléfono (Único paso) */}
          <div className="form-section">
            <h3 className="section-title">Información de Contacto</h3>
            <div className="form-group">
              <label htmlFor="phone">Teléfono *</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const formatted = e.target.value.replace(/\D/g, '').slice(0, 15)
                  setPhone(formatted)
                  setError(null)
                }}
                placeholder="Ej: 987654321"
                className="form-input"
                maxLength={15}
              />
              <p className="form-help-text">
                Usaremos este número si un contador necesita contactarte.
              </p>
            </div>
            {error && (
              <div className="form-error-message">
                {error}
              </div>
            )}
          </div>

          <div className="welcome-actions">
            <button
              onClick={handleStartChat}
              disabled={saving || !phone.trim()}
              className="start-chat-button"
            >
              {saving ? (
                <>
                  <span className="material-icons-round button-spinner">sync</span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-icons-round">rocket_launch</span>
                  Comenzar con Arise
                </>
              )}
            </button>
          </div>

          {/* Sección de Servicios - Informativa */}
          <div className="welcome-features">
            <h3 className="section-title">
              <span className="material-icons-round">category</span>
              Nuestros Servicios
            </h3>
            <div className="features-grid">
              {MTZ_SERVICES.map((service) => (
                <div key={service.id} className="feature-card">
                  <div className="feature-icon">{service.icon}</div>
                  <h4>{service.name}</h4>
                  <p>{service.description}</p>
                  <div className="service-features">
                    <ul>
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="service-actions">
                    {service.contactInfo?.whatsapp && (
                      <button
                        type="button"
                        onClick={() => openLink(getWhatsAppLink(`Hola, me interesa ${service.name}`))}
                        className="service-contact-button"
                      >
                        📱 Contactar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvitadoWelcome
