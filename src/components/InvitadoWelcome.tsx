import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { MTZ_SERVICES } from '../config/services'
import { getWhatsAppLink, openLink } from '../config/links'
import './InvitadoWelcome.css'

interface InvitadoWelcomeProps {
  user: {
    id: string
    email: string
    role: 'user' | 'admin'
    user_type?: 'invitado' | 'cliente_nuevo' | 'cliente_existente'
  }
  onContinue: () => void
}

function InvitadoWelcome({ user, onContinue }: InvitadoWelcomeProps) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [isClient, setIsClient] = useState<boolean | null>(null) // null = no respondido
  const [saving, setSaving] = useState(false)

  const handleStartChat = async () => {
    setSaving(true)
    try {
      // Determinar el tipo de usuario basado en si es cliente
      let userType: 'invitado' | 'cliente_nuevo' | 'cliente_existente' = 'invitado'
      if (isClient === true) {
        userType = 'cliente_nuevo' // Nuevo cliente
      }

      // Actualizar perfil con información básica
      const updates: any = {}
      if (name.trim()) updates.full_name = name.trim()
      updates.user_type = userType
      
      // Si hay información de empresa o es cliente, actualizar client_info
      if (company.trim() || phone.trim() || isClient === true) {
        const { data: existing } = await supabase
          .from('client_info')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existing) {
          await supabase
            .from('client_info')
            .insert({
              user_id: user.id,
              company_name: company.trim() || null,
              phone: phone.trim() || null
            })
        } else {
          await supabase
            .from('client_info')
            .update({
              company_name: company.trim() || null,
              phone: phone.trim() || null
            })
            .eq('user_id', user.id)
        }
      }

      // Actualizar perfil
      await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
    } catch (error) {
      console.error('Error al guardar información:', error)
    } finally {
      setSaving(false)
      onContinue()
    }
  }

  return (
    <div className="invitado-welcome">
      <div className="welcome-container">
        <div className="welcome-header">
          <div className="welcome-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="welcome-title">¡Bienvenido a MTZ Asistente!</h1>
          <p className="welcome-subtitle">
            Estamos aquí para ayudarte. Cuéntanos un poco sobre ti para personalizar tu experiencia.
          </p>
        </div>

        <div className="welcome-form">
          <div className="form-section">
            <h3 className="section-title">Información Básica</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Nombre completo (opcional)</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="company">Empresa (opcional)</label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nombre de tu empresa"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Teléfono (opcional)</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Tu teléfono de contacto"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="welcome-features">
            <h3 className="section-title">Nuestros Servicios</h3>
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
                    <button
                      type="button"
                      onClick={() => openLink(service.link)}
                      className="service-link-button"
                    >
                      ℹ️ Más información
                    </button>
                  </div>
                </div>
              ))}
              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h4>Asistente Virtual</h4>
                <p>Obtén respuestas rápidas y atención personalizada las 24 horas</p>
                <div className="service-features">
                  <ul>
                    <li>Respuestas instantáneas</li>
                    <li>Atención 24/7</li>
                    <li>Información personalizada</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">¿Eres cliente de MTZ?</h3>
            <div className="client-options">
              <button
                type="button"
                onClick={() => setIsClient(true)}
                className={`client-option-button ${isClient === true ? 'selected' : ''}`}
              >
                <span className="option-icon">✅</span>
                <span>Sí, soy cliente</span>
              </button>
              <button
                type="button"
                onClick={() => setIsClient(false)}
                className={`client-option-button ${isClient === false ? 'selected' : ''}`}
              >
                <span className="option-icon">❌</span>
                <span>No, no soy cliente</span>
              </button>
            </div>
            {isClient === true && (
              <p className="client-note">
                Como cliente, tendrás acceso a información y servicios personalizados
              </p>
            )}
          </div>

          <div className="welcome-actions">
            <button
              onClick={handleStartChat}
              disabled={saving}
              className="start-chat-button"
            >
              {saving ? (
                <>
                  <span className="button-spinner"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Comenzar a Chatear
                </>
              )}
            </button>
            <p className="skip-text">
              Puedes omitir estos datos y completarlos más tarde
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvitadoWelcome
