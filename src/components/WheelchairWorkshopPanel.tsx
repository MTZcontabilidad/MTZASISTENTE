/**
 * Panel de administración para Taller de Sillas de Ruedas
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAllWheelchairRequests,
  updateWheelchairRequestStatus,
  type WheelchairWorkshopRequest
} from '../lib/wheelchairWorkshop'
import { supabase } from '../lib/supabase'
import './WheelchairWorkshopPanel.css'

interface WheelchairWorkshopPanelProps {
  onRefresh?: () => void
}

export default function WheelchairWorkshopPanel({ onRefresh }: WheelchairWorkshopPanelProps = {}) {
  const [requests, setRequests] = useState<WheelchairWorkshopRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<WheelchairWorkshopRequest | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [confirming, setConfirming] = useState(false)
  
  // Exponer función de refresh al padre
  useEffect(() => {
    if (onRefresh) {
      // Guardar referencia para que el padre pueda llamarla
      (window as any).__wheelchairPanelRefresh = fetchRequests
    }
    return () => {
      delete (window as any).__wheelchairPanelRefresh
    }
  }, [onRefresh, filter])

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllWheelchairRequests(filter === 'all' ? undefined : filter)
      setRequests(data || [])
    } catch (error: any) {
      // Solo mostrar error si no es un error de RPC que tiene fallback
      if (!error?.message?.includes('ambiguous') && !error?.message?.includes('column reference')) {
        console.error('Error al cargar solicitudes:', error)
      } else {
        console.warn('Error de RPC con fallback disponible, usando consulta directa')
      }
      // Asegurar que siempre tengamos un array
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleStatusChange = async (
    requestId: string,
    newStatus: WheelchairWorkshopRequest['status'],
    confirmedDate?: string,
    confirmedTime?: string
  ) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      
      const success = await updateWheelchairRequestStatus(
        requestId,
        newStatus,
        adminNotes || undefined,
        confirmedDate,
        confirmedTime,
        user?.id
      )

      if (success) {
        await fetchRequests()
        setShowModal(false)
        setSelectedRequest(null)
        setAdminNotes('')
        alert('Estado actualizado correctamente')
      } else {
        alert('Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el estado')
    }
  }

  const openModal = (request: WheelchairWorkshopRequest) => {
    setSelectedRequest(request)
    setAdminNotes(request.admin_notes || '')
    setShowModal(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No especificado'
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return ''
    return timeString.substring(0, 5)
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    confirmed: requests.filter(r => r.status === 'confirmed').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      pending: { text: 'Pendiente', class: 'status-pending' },
      confirmed: { text: 'Confirmado', class: 'status-confirmed' },
      in_progress: { text: 'En Progreso', class: 'status-in-progress' },
      completed: { text: 'Completado', class: 'status-completed' },
      cancelled: { text: 'Cancelado', class: 'status-cancelled' },
      rejected: { text: 'Rechazado', class: 'status-rejected' }
    }
    return badges[status] || badges.pending
  }

  if (loading) {
    return (
      <div className="wheelchair-panel">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wheelchair-panel">
      {/* Información de contacto */}
      <div className="panel-contact-info">
        <p className="panel-phone">📞 Teléfono: +56 9 3300 3113</p>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pendientes</div>
        </div>
        <div className="stat-card confirmed">
          <div className="stat-value">{stats.confirmed}</div>
          <div className="stat-label">Confirmadas</div>
        </div>
        <div className="stat-card in-progress">
          <div className="stat-value">{stats.in_progress}</div>
          <div className="stat-label">En Progreso</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completadas</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-bar">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button
          className={`filter-button ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pendientes
        </button>
        <button
          className={`filter-button ${filter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setFilter('confirmed')}
        >
          Confirmadas
        </button>
        <button
          className={`filter-button ${filter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setFilter('in_progress')}
        >
          En Progreso
        </button>
        <button
          className={`filter-button ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completadas
        </button>
      </div>

      {/* Lista de solicitudes */}
      <div className="requests-list">
        {requests.length === 0 ? (
          <div className="empty-state">
            <p>No hay solicitudes {filter !== 'all' ? `con estado "${filter}"` : ''}</p>
          </div>
        ) : (
          requests.map((request) => {
            const badge = getStatusBadge(request.status)
            return (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div>
                    <h3>{request.client_name}</h3>
                    <p className="request-meta">
                      📞 {request.client_phone}
                      {request.client_email && ` • ✉️ ${request.client_email}`}
                    </p>
                  </div>
                  <span className={`status-badge ${badge.class}`}>{badge.text}</span>
                </div>

                <div className="request-details">
                  <div className="detail-row">
                    <strong>Tipo de servicio:</strong> {request.service_type}
                  </div>
                  <div className="detail-row">
                    <strong>Descripción:</strong> {request.service_description}
                  </div>
                  {request.wheelchair_type && (
                    <div className="detail-row">
                      <strong>Tipo de silla:</strong> {request.wheelchair_type}
                      {request.wheelchair_brand && ` - ${request.wheelchair_brand}`}
                      {request.wheelchair_model && ` ${request.wheelchair_model}`}
                    </div>
                  )}
                  {request.preferred_date && (
                    <div className="detail-row">
                      <strong>Fecha preferida:</strong> {formatDate(request.preferred_date)}
                      {request.preferred_time && ` a las ${formatTime(request.preferred_time)}`}
                    </div>
                  )}
                  {request.location && (
                    <div className="detail-row">
                      <strong>Ubicación:</strong> {request.location === 'domicilio' ? 'Domicilio' : 'Taller'}
                      {request.location === 'domicilio' && request.address_if_domicilio && (
                        <span> - {request.address_if_domicilio}</span>
                      )}
                    </div>
                  )}
                  {request.is_urgent && (
                    <div className="detail-row urgent">
                      <strong>⚠️ URGENTE</strong>
                    </div>
                  )}
                  {request.confirmed_date && (
                    <div className="detail-row">
                      <strong>Fecha confirmada:</strong> {formatDate(request.confirmed_date)}
                      {request.confirmed_time && ` a las ${formatTime(request.confirmed_time)}`}
                    </div>
                  )}
                  {request.admin_notes && (
                    <div className="detail-row notes">
                      <strong>Notas:</strong> {request.admin_notes}
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  <button onClick={() => openModal(request)} className="action-button view">
                    Ver/Editar
                  </button>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          const date = prompt('Fecha de confirmación (YYYY-MM-DD):')
                          const time = prompt('Hora de confirmación (HH:MM):')
                          if (date) {
                            handleStatusChange(request.id, 'confirmed', date, time || undefined)
                          }
                        }}
                        className="action-button confirm"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => handleStatusChange(request.id, 'rejected')}
                        className="action-button reject"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {request.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(request.id, 'in_progress')}
                      className="action-button start"
                    >
                      Iniciar Trabajo
                    </button>
                  )}
                  {request.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange(request.id, 'completed')}
                      className="action-button complete"
                    >
                      Completar
                    </button>
                  )}
                </div>

                <div className="request-footer">
                  <small>Creado: {formatDate(request.created_at)}</small>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de edición */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Solicitud - {selectedRequest.client_name}</h3>
              <button onClick={() => setShowModal(false)} className="close-button">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Estado:</label>
                <select
                  value={selectedRequest.status}
                  onChange={(e) => {
                    setSelectedRequest({
                      ...selectedRequest,
                      status: e.target.value as any
                    })
                  }}
                  className="form-input"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notas del administrador:</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="form-textarea"
                  rows={4}
                  placeholder="Agrega notas sobre esta solicitud..."
                />
              </div>
              {selectedRequest.status === 'confirmed' && (
                <>
                  <div className="form-group">
                    <label>Fecha confirmada:</label>
                    <input
                      type="date"
                      value={selectedRequest.confirmed_date || ''}
                      onChange={(e) => {
                        setSelectedRequest({
                          ...selectedRequest,
                          confirmed_date: e.target.value || null
                        })
                      }}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora confirmada:</label>
                    <input
                      type="time"
                      value={selectedRequest.confirmed_time || ''}
                      onChange={(e) => {
                        setSelectedRequest({
                          ...selectedRequest,
                          confirmed_time: e.target.value || null
                        })
                      }}
                      className="form-input"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  handleStatusChange(
                    selectedRequest.id,
                    selectedRequest.status,
                    selectedRequest.confirmed_date || undefined,
                    selectedRequest.confirmed_time || undefined
                  )
                }}
                className="btn-primary"
                disabled={confirming}
              >
                {confirming ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

