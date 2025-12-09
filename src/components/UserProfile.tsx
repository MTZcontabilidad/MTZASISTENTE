/**
 * Panel de perfil de usuario
 * Permite a los usuarios actualizar su información personal
 * Incluye opciones para identificar si es cliente MTZ y vincular con empresa
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getOrCreateClientInfo, updateClientInfo } from '../lib/clientInfo'
import type { ClientInfo } from '../types'
import './UserProfile.css'

interface UserProfileProps {
  userId: string
  userEmail: string
  userName?: string
  onUpdate?: () => void
}

export default function UserProfile({ userId, userEmail, userName, onUpdate }: UserProfileProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [matchingCompany, setMatchingCompany] = useState<any>(null)
  const [validatingRUT, setValidatingRUT] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    full_name: userName || '',
    phone: '',
    address: '',
    company_name: '',
    notes: '',
    preferred_name: '',
    gender: '' as 'masculino' | 'femenino' | 'otro' | '',
    use_formal_address: true,
    is_mtz_client: false,
    wants_to_be_client: false,
    rut_empresa: '',
    clave_sii: ''
  })

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener perfil de usuario
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle()

      // Obtener información del cliente
      const info = await getOrCreateClientInfo(userId)

      if (info) {
        setClientInfo(info)
        setFormData({
          full_name: profile?.full_name || userName || '',
          phone: info.phone || '',
          address: info.address || '',
          company_name: info.company_name || '',
          notes: info.notes || '',
          preferred_name: info.preferred_name || '',
          gender: (info.gender as any) || '',
          use_formal_address: info.use_formal_address !== false,
          is_mtz_client: info.is_mtz_client || false,
          wants_to_be_client: info.wants_to_be_client || false,
          rut_empresa: info.rut_empresa || '',
          clave_sii: '' // No mostrar la clave por seguridad
        })

        // Si ya tiene RUT empresa, buscar empresa correspondiente
        if (info.rut_empresa) {
          await validateRUTAndFindCompany(info.rut_empresa, info.clave_sii || '')
        }
      }
    } catch (err: any) {
      console.error('Error al cargar datos:', err)
      setError('Error al cargar tu información')
    } finally {
      setLoading(false)
    }
  }

  // Validar RUT y buscar empresa correspondiente
  const validateRUTAndFindCompany = async (rut: string, clave: string) => {
    if (!rut || !rut.trim()) {
      setMatchingCompany(null)
      return
    }

    try {
      setValidatingRUT(true)
      
      // Limpiar formato del RUT (quitar puntos y guiones)
      const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').trim()
      
      // Buscar empresa por RUT
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('rut', cleanRUT)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (companies) {
        // Si hay clave, validar que coincida
        if (clave && companies.clave_impuestos) {
          // En producción, aquí deberías comparar hashes o usar encriptación
          // Por ahora, comparación simple (NO SEGURO para producción)
          if (clave === companies.clave_impuestos) {
            setMatchingCompany(companies)
            setFormData(prev => ({
              ...prev,
              company_name: companies.company_name || prev.company_name,
              is_mtz_client: true
            }))
          } else {
            setMatchingCompany(null)
            setError('La clave del SII no coincide con la empresa registrada')
          }
        } else {
          // Si no hay clave pero hay empresa, solo mostrar la empresa
          setMatchingCompany(companies)
          setFormData(prev => ({
            ...prev,
            company_name: companies.company_name || prev.company_name
          }))
        }
      } else {
        setMatchingCompany(null)
        if (clave) {
          // Si hay RUT y clave pero no se encuentra empresa, puede ser nuevo cliente
          setFormData(prev => ({
            ...prev,
            wants_to_be_client: true
          }))
        }
      }
    } catch (err: any) {
      console.error('Error al validar RUT:', err)
      setMatchingCompany(null)
    } finally {
      setValidatingRUT(false)
    }
  }

  const handleRUTChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rut = e.target.value
    setFormData(prev => ({ ...prev, rut_empresa: rut }))
    
    // Validar RUT cuando el usuario termine de escribir
    if (rut.length >= 8) {
      await validateRUTAndFindCompany(rut, formData.clave_sii)
    } else {
      setMatchingCompany(null)
    }
  }

  const handleClaveChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const clave = e.target.value
    setFormData(prev => ({ ...prev, clave_sii: clave }))
    
    // Si ya hay RUT, validar nuevamente con la nueva clave
    if (formData.rut_empresa && clave.length > 0) {
      await validateRUTAndFindCompany(formData.rut_empresa, clave)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Actualizar perfil de usuario
      if (formData.full_name) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ full_name: formData.full_name })
          .eq('id', userId)

        if (profileError) throw profileError
      }

      // Actualizar información del cliente
      const updateData: Partial<ClientInfo> = {
        phone: formData.phone || null,
        address: formData.address || null,
        company_name: formData.company_name || null,
        notes: formData.notes || null,
        preferred_name: formData.preferred_name || null,
        gender: formData.gender || null,
        use_formal_address: formData.use_formal_address,
        is_mtz_client: formData.is_mtz_client,
        wants_to_be_client: formData.wants_to_be_client,
        rut_empresa: formData.rut_empresa || null,
        clave_sii: formData.clave_sii || null // En producción, esto debería estar encriptado
      }

      // Si se encontró una empresa y se validó correctamente, actualizar también
      if (matchingCompany && formData.is_mtz_client) {
        updateData.company_name = matchingCompany.company_name || formData.company_name
      }

      const updated = await updateClientInfo(userId, updateData)

      if (updated) {
        setSuccess('Información actualizada correctamente')
        await loadUserData()
        onUpdate?.()
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error('No se pudo actualizar la información')
      }
    } catch (err: any) {
      console.error('Error al guardar:', err)
      setError(err.message || 'Error al guardar la información')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="user-profile-loading">
          <div className="spinner"></div>
          <p>Cargando tu información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-card">
        <h2 className="user-profile-title">Mi Perfil</h2>
        <p className="user-profile-subtitle">
          Actualiza tu información personal y de contacto
        </p>

        {error && (
          <div className="user-profile-message error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="user-profile-message success">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="user-profile-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="email"
                id="email"
                value={userEmail}
                disabled
                className="form-input disabled"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: window.location.origin,
                    }
                  });
                  if (error) {
                    setError('Error al iniciar sesión con Google');
                  }
                }}
                className="user-profile-button"
                style={{
                  padding: '10px 16px',
                  whiteSpace: 'nowrap'
                }}
              >
                🔐 Validar con Gmail
              </button>
            </div>
            <small className="form-help">No se puede modificar directamente. Usa el botón para validar con Gmail.</small>
          </div>

          <div className="form-group">
            <label htmlFor="full_name">Nombre Completo</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Tu nombre completo"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferred_name">Nombre Preferido o Apodo (opcional)</label>
            <input
              type="text"
              id="preferred_name"
              name="preferred_name"
              value={formData.preferred_name}
              onChange={handleChange}
              placeholder="Cómo te gusta que te llamen"
              className="form-input"
            />
            <small className="form-help">Si prefieres que te llamen por un apodo o nombre diferente</small>
          </div>

          <div className="form-group">
            <label htmlFor="gender">Género (opcional)</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">No especificar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
            <small className="form-help">Usado para determinar si usar "Don" o "Srita" en el trato</small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="use_formal_address"
                checked={formData.use_formal_address}
                onChange={handleChange}
              />
              {' '}Usar trato formal (Don/Srita)
            </label>
            <small className="form-help">Si está marcado, te llamaremos "Don Nombre" o "Srita Nombre"</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ej: +56 9 1234 5678"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Dirección (opcional)</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Tu dirección"
              className="form-input"
            />
          </div>

          {/* Sección de Cliente MTZ */}
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e0e0e0' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Información de Cliente MTZ</h3>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_mtz_client"
                  checked={formData.is_mtz_client}
                  onChange={handleChange}
                />
                {' '}Soy cliente de MTZ
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="wants_to_be_client"
                  checked={formData.wants_to_be_client}
                  onChange={handleChange}
                />
                {' '}Quiero ser cliente de MTZ
              </label>
            </div>

            {formData.is_mtz_client && (
              <>
                <div className="form-group">
                  <label htmlFor="rut_empresa">RUT de la Empresa *</label>
                  <input
                    type="text"
                    id="rut_empresa"
                    name="rut_empresa"
                    value={formData.rut_empresa}
                    onChange={handleRUTChange}
                    placeholder="Ej: 12345678-9"
                    className="form-input"
                    required={formData.is_mtz_client}
                  />
                  {validatingRUT && (
                    <small className="form-help" style={{ color: '#666' }}>Validando RUT...</small>
                  )}
                  {matchingCompany && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#e8f5e9', borderRadius: '4px' }}>
                      ✅ Empresa encontrada: <strong>{matchingCompany.company_name}</strong>
                    </div>
                  )}
                  {formData.rut_empresa && !matchingCompany && !validatingRUT && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '4px', color: 'var(--text-primary)' }}>
                      ⚠️ No se encontró empresa con este RUT. Si eres cliente nuevo, contacta con MTZ.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="clave_sii">Clave del SII (opcional)</label>
                  <input
                    type="password"
                    id="clave_sii"
                    name="clave_sii"
                    value={formData.clave_sii}
                    onChange={handleClaveChange}
                    placeholder="Tu clave de impuestos internos"
                    className="form-input"
                  />
                  <small className="form-help">Se usa para identificar tu empresa automáticamente. Se almacena de forma segura.</small>
                </div>

                {matchingCompany && (
                  <div className="form-group">
                    <label htmlFor="company_name">Nombre de Empresa</label>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Nombre de tu empresa"
                      className="form-input"
                    />
                    <small className="form-help">Se actualiza automáticamente cuando validas el RUT</small>
                  </div>
                )}
              </>
            )}

            {!formData.is_mtz_client && (
              <div className="form-group">
                <label htmlFor="company_name">Nombre de Empresa (opcional)</label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Nombre de tu empresa"
                  className="form-input"
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas (opcional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Información adicional que quieras compartir"
              rows={4}
              className="form-textarea"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
