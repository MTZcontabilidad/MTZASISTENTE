/**
 * Panel de administración para Transporte Inclusivo - Fundación Te Quiero Feliz
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAllTransportRequests,
  updateTransportRequestStatus,
  type TransportRequest
} from '../lib/transportRequests'
import { supabase } from '../lib/supabase'
import './TransportPanel.css'
import './WheelchairWorkshopPanel.css'

export default function TransportPanel() {
  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [confirming, setConfirming] = useState(false)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllTransportRequests(filter === 'all' ? undefined : filter)
      setRequests(data)
    } catch (error) {
      console.error('Error al cargar solicitudes:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleStatusChange = async (
    requestId: string,
    newStatus: TransportRequest['status'],
    confirmedDate?: string,
    confirmedTime?: string
  ) => {
    try {
      setConfirming(true)
      const {
        data: { user }
      } = await supabase.auth.getUser()
      
      const success = await updateTransportRequestStatus(
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
    } finally {
      setConfirming(false)
    }
  }

  const openModal = (request: TransportRequest) => {
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
      <div className="transport-panel">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transport-panel">
      <div className="panel-header">
        <div>
          <h2>🚐 Transporte Inclusivo - Fundación Te Quiero Feliz</h2>
          <p className="panel-subtitle">Gestiona las solicitudes de transporte accesible</p>
          <p className="panel-phone">📞 Teléfono: +56 9 3300 3113</p>
        </div>
        <button onClick={fetchRequests} className="refresh-button" disabled={loading}>
          🔄 Actualizar
        </button>
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
                    <h3>{request.passenger_name}</h3>
                    <p className="request-meta">
                      📞 {request.passenger_phone}
                      {request.passenger_email && ` • ✉️ ${request.passenger_email}`}
                      {request.passenger_age && ` • Edad: ${request.passenger_age} años`}
                    </p>
                  </div>
                  <span className={`status-badge ${badge.class}`}>{badge.text}</span>
                </div>

                <div className="request-details">
                  <div className="detail-row">
                    <strong>Tipo de viaje:</strong> {request.trip_type === 'ida' ? 'Solo ida' : request.trip_type === 'vuelta' ? 'Solo vuelta' : 'Ida y vuelta'}
                  </div>
                  <div className="detail-row">
                    <strong>Origen:</strong> {request.origin_address}
                  </div>
                  <div className="detail-row">
                    <strong>Destino:</strong> {request.destination_address}
                  </div>
                  <div className="detail-row">
                    <strong>Fecha del viaje:</strong> {formatDate(request.trip_date)} a las {formatTime(request.trip_time)}
                  </div>
                  {request.return_date && (
                    <div className="detail-row">
                      <strong>Fecha de retorno:</strong> {formatDate(request.return_date)}
                      {request.return_time && ` a las ${formatTime(request.return_time)}`}
                    </div>
                  )}
                  {request.has_mobility_aid && (
                    <div className="detail-row">
                      <strong>Ayuda de movilidad:</strong> {request.mobility_aid_type || 'Sí'}
                      {request.mobility_aid_description && ` - ${request.mobility_aid_description}`}
                    </div>
                  )}
                  {request.special_needs && (
                    <div className="detail-row">
                      <strong>Necesidades especiales:</strong> {request.special_needs}
                    </div>
                  )}
                  {request.companion_name && (
                    <div className="detail-row">
                      <strong>Acompañante:</strong> {request.companion_name}
                      {request.companion_phone && ` - ${request.companion_phone}`}
                      {request.companion_relationship && ` (${request.companion_relationship})`}
                    </div>
                  )}
                  {request.trip_purpose && (
                    <div className="detail-row">
                      <strong>Motivo del viaje:</strong> {request.trip_purpose}
                      {request.trip_purpose_description && ` - ${request.trip_purpose_description}`}
                    </div>
                  )}
                  {request.requires_assistance && (
                    <div className="detail-row">
                      <strong>Requiere asistencia:</strong> {request.assistance_type || 'Sí'}
                    </div>
                  )}
                  {request.number_of_passengers > 1 && (
                    <div className="detail-row">
                      <strong>Número de pasajeros:</strong> {request.number_of_passengers}
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
                      Iniciar Viaje
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
              <h3>Editar Solicitud - {selectedRequest.passenger_name}</h3>
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

