/**
 * Panel de perfil de usuario
 * Permite a los usuarios actualizar su información personal
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

  // Formulario
  const [formData, setFormData] = useState({
    full_name: userName || '',
    phone: '',
    address: '',
    company_name: '',
    notes: ''
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
          notes: info.notes || ''
        })
      }
    } catch (err: any) {
      console.error('Error al cargar datos:', err)
      setError('Error al cargar tu información')
    } finally {
      setLoading(false)
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
        notes: formData.notes || null
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
            <input
              type="email"
              id="email"
              value={userEmail}
              disabled
              className="form-input disabled"
            />
            <small className="form-help">No se puede modificar</small>
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

