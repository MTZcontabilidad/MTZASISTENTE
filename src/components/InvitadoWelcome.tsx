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
  const [isClient, setIsClient] = useState<boolean | null>(null) // null = no respondido
  const [rut, setRut] = useState('')
  const [claveImpuestos, setClaveImpuestos] = useState('')
  const [phone, setPhone] = useState('') // Teléfono para no clientes
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [foundCompany, setFoundCompany] = useState<string | null>(null)

  // Función para formatear RUT (12345678-9)
  const formatRut = (value: string): string => {
    // Remover todo excepto números y K
    const cleaned = value.replace(/[^0-9kK]/g, '')
    
    if (cleaned.length === 0) return ''
    
    // Si tiene más de 1 carácter, separar número del dígito verificador
    if (cleaned.length > 1) {
      const number = cleaned.slice(0, -1)
      const dv = cleaned.slice(-1).toUpperCase()
      return `${number}-${dv}`
    }
    
    return cleaned.toUpperCase()
  }

  // Función para buscar y validar empresa por RUT y clave de impuestos
  const buscarEmpresaPorRut = async (rutValue: string, claveValue?: string): Promise<{ company_name: string; id: string; clave_impuestos: string | null } | null> => {
    try {
      let query = supabase
        .from('companies')
        .select('id, company_name, rut, clave_impuestos')
        .eq('rut', rutValue)
        .eq('is_active', true)

      // Si se proporciona la clave, validarla también
      if (claveValue && claveValue.trim()) {
        query = query.eq('clave_impuestos', claveValue.trim())
      }

      const { data, error } = await query.maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error al buscar empresa:', error)
        return null
      }

      if (data) {
        // Si se proporcionó clave y la empresa tiene clave, validar que coincidan
        if (claveValue && data.clave_impuestos) {
          if (data.clave_impuestos !== claveValue.trim()) {
            return null // Clave no coincide
          }
        }
        return { 
          company_name: data.company_name, 
          id: data.id,
          clave_impuestos: data.clave_impuestos
        }
      }

      return null
    } catch (error) {
      console.error('Error al buscar empresa:', error)
      return null
    }
  }

  const handleRutChange = async (value: string) => {
    const formatted = formatRut(value)
    setRut(formatted)
    setError(null)
    setFoundCompany(null)

    // Si el RUT está completo (tiene formato 12345678-9), buscar empresa (sin validar clave aún)
    if (formatted.includes('-') && formatted.length >= 10) {
      const empresa = await buscarEmpresaPorRut(formatted)
      if (empresa) {
        setFoundCompany(empresa.company_name)
      } else {
        setFoundCompany(null)
      }
    }
  }

  const handleStartChat = async () => {
    setSaving(true)
    setError(null)

    try {
      let userType: 'invitado' | 'cliente_nuevo' | 'cliente_existente' = 'invitado'
      let companyName: string | null = null

      // Si es cliente, validar RUT y clave
      if (isClient === true) {
        if (!rut.trim()) {
          setError('Por favor ingresa el RUT de tu empresa')
          setSaving(false)
          return
        }

        if (!claveImpuestos.trim()) {
          setError('Por favor ingresa la clave de impuestos internos')
          setSaving(false)
          return
        }

        // Buscar y validar empresa por RUT y clave de impuestos
        const empresa = await buscarEmpresaPorRut(rut.trim(), claveImpuestos.trim())
        
        if (empresa) {
          // Empresa encontrada y clave válida - asignar automáticamente
          companyName = empresa.company_name
          userType = 'cliente_existente' // Cliente existente porque la empresa ya está en el sistema
        } else {
          // Empresa no encontrada o clave incorrecta
          setError('RUT o clave de impuestos incorrectos. Por favor verifica tus datos.')
          setSaving(false)
          return
        }
      }

      // Actualizar perfil con email si no es cliente (para sincronizar con teléfono)
      const updates: any = {
        user_type: userType
      }

      // Si no es cliente, actualizar también el email con el teléfono
      if (isClient === false && phone.trim()) {
        updates.email = `invitado_${phone.trim()}@mtz.local`
        updates.full_name = `Invitado ${phone.trim()}`
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (profileError) {
        console.error('Error al actualizar perfil:', profileError)
        // Intentar upsert como fallback
        await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: isClient === false ? `invitado_${phone.trim()}@mtz.local` : user.email,
            full_name: isClient === false ? `Invitado ${phone.trim()}` : undefined,
            role: 'user',
            user_type: userType
          }, {
            onConflict: 'id'
          })
      }

      // Actualizar o crear client_info
      const { data: existing } = await supabase
        .from('client_info')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      const clientInfoData: any = {
        phone: isClient === false ? phone.trim() : null,
        rut: isClient === true ? (rut.trim() || null) : null,
        clave_impuestos: isClient === true ? (claveImpuestos.trim() || null) : null,
        company_name: companyName || null
      }

      if (!existing) {
        const { error: clientInfoError } = await supabase
          .from('client_info')
          .insert({
            user_id: user.id,
            ...clientInfoData
          })
        
        if (clientInfoError) {
          console.error('Error al crear client_info:', clientInfoError)
          throw clientInfoError
        }
      } else {
        const { error: clientInfoError } = await supabase
          .from('client_info')
          .update(clientInfoData)
          .eq('user_id', user.id)
        
        if (clientInfoError) {
          console.error('Error al actualizar client_info:', clientInfoError)
          throw clientInfoError
        }
      }

      // Continuar a Arise (chat)
      onContinue()
    } catch (error: any) {
      console.error('Error al guardar información:', error)
      setError('Error al guardar la información. Por favor intenta nuevamente.')
      setSaving(false)
    }
  }

  return (
    <div className="invitado-welcome">
      <div className="welcome-container">
        <div className="welcome-header">
          <h1 className="welcome-title">¡Bienvenido a Arise!</h1>
          <p className="welcome-subtitle">
            Tu asistente virtual de MTZ. Primero, cuéntanos si eres cliente de MTZ.
          </p>
        </div>

        <div className="welcome-form">
          {/* Sección: ¿Es cliente MTZ? */}
          <div className="form-section">
            <h3 className="section-title">¿Eres cliente de MTZ?</h3>
            <div className="client-options">
              <button
                type="button"
                onClick={() => {
                  setIsClient(true)
                  setError(null)
                  setRut('')
                  setClaveImpuestos('')
                  setFoundCompany(null)
                }}
                className={`client-option-button ${isClient === true ? 'selected' : ''}`}
              >
                <span className="option-icon">✅</span>
                <span>Sí, soy cliente</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsClient(false)
                  setError(null)
                  setRut('')
                  setClaveImpuestos('')
                  setFoundCompany(null)
                }}
                className={`client-option-button ${isClient === false ? 'selected' : ''}`}
              >
                <span className="option-icon">❌</span>
                <span>No, no soy cliente</span>
              </button>
            </div>
          </div>

          {/* Formulario de RUT y Clave (solo si es cliente) */}
          {isClient === true && (
            <div className="form-section">
              <h3 className="section-title">Datos de tu Empresa</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="rut">RUT de la Empresa *</label>
                  <input
                    id="rut"
                    type="text"
                    value={rut}
                    onChange={(e) => handleRutChange(e.target.value)}
                    placeholder="12345678-9"
                    className="form-input"
                    maxLength={12}
                  />
                  {foundCompany && (
                    <p className="form-success-message">
                      ✅ Empresa encontrada: <strong>{foundCompany}</strong>
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="clave-impuestos">Clave de Impuestos Internos *</label>
                  <input
                    id="clave-impuestos"
                    type="password"
                    value={claveImpuestos}
                    onChange={(e) => setClaveImpuestos(e.target.value)}
                    placeholder="Ingresa tu clave del SII"
                    className="form-input"
                  />
                </div>
              </div>
              {error && (
                <div className="form-error-message">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Formulario de teléfono (solo si NO es cliente) */}
          {isClient === false && (
            <div className="form-section">
              <h3 className="section-title">Ingresa tu Teléfono</h3>
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
                  placeholder="Ej: 912345678"
                  className="form-input"
                  maxLength={15}
                />
                <p className="form-help-text">
                  Solo necesitamos tu teléfono para registrarte y poder contactarte
                </p>
              </div>
              {error && (
                <div className="form-error-message">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Botón de acción - MOVIDO ARRIBA */}
          {(isClient !== null) && (
            <div className="welcome-actions">
              <button
                onClick={handleStartChat}
                disabled={
                  saving || 
                  (isClient === true && (!rut.trim() || !claveImpuestos.trim())) ||
                  (isClient === false && !phone.trim())
                }
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
                  Comenzar con Arise
                  </>
                )}
              </button>
              {((isClient === true && (!rut.trim() || !claveImpuestos.trim())) ||
                (isClient === false && !phone.trim())) && (
                <p className="skip-text">
                  Por favor completa los datos requeridos para continuar
                </p>
              )}
            </div>
          )}

          {/* Sección de Servicios - MOVIDA ABAJO */}
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
                <div className="feature-icon">🤖</div>
                <h4>Arise</h4>
                <p>Tu asistente virtual de MTZ. Respuestas rápidas y atención personalizada</p>
                <div className="service-features">
                  <ul>
                    <li>Respuestas instantáneas</li>
                    <li>Atención 24/7</li>
                    <li>Guía personalizada</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvitadoWelcome
