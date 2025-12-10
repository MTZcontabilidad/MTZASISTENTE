import { useState, useEffect } from 'react';
import { getUserMeetings, createMeeting } from '../lib/meetings';
import { getClientDocuments } from '../lib/documents';
import { getWorkshopRequestsByUserId } from '../lib/wheelchairWorkshop';
import { getTransportRequestsByUserId } from '../lib/transportRequests';
import { getOrCreateClientInfo, updateClientInfo } from '../lib/clientInfo';
import { getClientExtendedInfo, upsertClientExtendedInfo } from '../lib/clientExtendedInfo';
import type { Meeting, ClientInfo, ClientExtendedInfo } from '../types';
import type { ClientDocument } from '../lib/documents';
import UserProfile from './UserProfile';
import './ClientSections.css';

interface ClientMeetingsSectionProps {
  userId: string;
  onBack: () => void;
}

export function ClientMeetingsSection({ userId, onBack }: ClientMeetingsSectionProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_date: '',
    duration_minutes: 60,
  });

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const data = await getUserMeetings(userId);
      setMeetings(data);
    } catch (error) {
      console.error('Error al cargar reuniones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMeeting(userId, formData);
      setShowForm(false);
      setFormData({ title: '', description: '', meeting_date: '', duration_minutes: 60 });
      loadMeetings();
    } catch (error) {
      console.error('Error al crear reunión:', error);
      alert('Error al crear la reunión. Por favor, intenta nuevamente.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      pending: { text: 'Pendiente', class: 'status-pending' },
      approved: { text: 'Aprobada', class: 'status-approved' },
      rejected: { text: 'Rechazada', class: 'status-rejected' },
      cancelled: { text: 'Cancelada', class: 'status-cancelled' },
      completed: { text: 'Completada', class: 'status-completed' },
    };
    const badge = badges[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  return (
    <div className="client-section">
      <div className="section-header">
        <button onClick={onBack} className="back-button">
          ← Volver
        </button>
        <h2>Mis Reuniones</h2>
        <button onClick={() => setShowForm(!showForm)} className="create-button">
          {showForm ? 'Cancelar' : '+ Nueva Reunión'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Fecha y Hora</label>
            <input
              type="datetime-local"
              value={formData.meeting_date}
              onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Duración (minutos)</label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              min={15}
              step={15}
            />
          </div>
          <button type="submit" className="submit-button">
            Solicitar Reunión
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando reuniones...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="empty-state">
          <p>No tienes reuniones programadas.</p>
        </div>
      ) : (
        <div className="meetings-list">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="meeting-card">
              <div className="meeting-header">
                <h3>{meeting.title}</h3>
                {getStatusBadge(meeting.status)}
              </div>
              {meeting.description && <p className="meeting-description">{meeting.description}</p>}
              <div className="meeting-details">
                <span>📅 {formatDate(meeting.meeting_date)}</span>
                <span>⏱️ {meeting.duration_minutes} minutos</span>
              </div>
              {meeting.admin_notes && (
                <div className="admin-notes">
                  <strong>Notas del administrador:</strong> {meeting.admin_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ClientDocumentsSectionProps {
  userId: string;
  onBack: () => void;
}

export function ClientDocumentsSection({ userId, onBack }: ClientDocumentsSectionProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await getClientDocuments(userId, filter !== 'all' ? { type: filter } : undefined);
      setDocuments(data);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [userId, filter]);

  const handleDownload = (doc: ClientDocument) => {
    if (doc.download_url) {
      window.open(doc.download_url, '_blank');
    } else if (doc.file_url) {
      window.open(doc.file_url, '_blank');
    } else {
      alert('No hay URL de descarga disponible para este documento.');
    }
  };

  const getDocumentIcon = (type: string) => {
    const icons: Record<string, string> = {
      iva: '📊',
      erut: '📋',
      factura: '🧾',
      boleta: '🧾',
      declaracion: '📑',
      otro: '📄',
    };
    return icons[type] || '📄';
  };

  return (
    <div className="client-section">
      <div className="section-header">
        <button onClick={onBack} className="back-button">
          ← Volver
        </button>
        <h2>Mis Documentos</h2>
      </div>

      <div className="filter-bar">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button
          className={filter === 'iva' ? 'active' : ''}
          onClick={() => setFilter('iva')}
        >
          IVA
        </button>
        <button
          className={filter === 'factura' ? 'active' : ''}
          onClick={() => setFilter('factura')}
        >
          Facturas
        </button>
        <button
          className={filter === 'boleta' ? 'active' : ''}
          onClick={() => setFilter('boleta')}
        >
          Boletas
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando documentos...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <p>No tienes documentos disponibles.</p>
        </div>
      ) : (
        <div className="documents-list">
          {documents.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="document-icon">{getDocumentIcon(doc.document_type)}</div>
              <div className="document-info">
                <h3>{doc.document_name}</h3>
                <p className="document-type">{doc.document_type.toUpperCase()}</p>
                {doc.period && <p className="document-period">Período: {doc.period}</p>}
                {doc.year && doc.month && (
                  <p className="document-date">
                    {new Date(doc.year, doc.month - 1).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDownload(doc)}
                className="download-button"
                disabled={!doc.download_url && !doc.file_url}
              >
                ⬇️ Descargar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ClientCompanyInfoSectionProps {
  userId: string;
  onBack: () => void;
}

export function ClientCompanyInfoSection({ userId, onBack }: ClientCompanyInfoSectionProps) {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [extendedInfo, setExtendedInfo] = useState<ClientExtendedInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadInfo = async () => {
    setLoading(true);
    try {
      const [info, extended] = await Promise.all([
        getOrCreateClientInfo(userId),
        getClientExtendedInfo(userId),
      ]);
      setClientInfo(info);
      setExtendedInfo(extended);
      setNotes(extended?.notes || info?.notes || '');
    } catch (error) {
      console.error('Error al cargar información:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, [userId]);

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      if (extendedInfo) {
        await upsertClientExtendedInfo(userId, { notes });
      } else if (clientInfo) {
        await updateClientInfo(userId, { notes });
      }
      alert('Notas guardadas correctamente.');
    } catch (error) {
      console.error('Error al guardar notas:', error);
      alert('Error al guardar las notas.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="client-section">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-section">
      <div className="section-header">
        <button onClick={onBack} className="back-button">
          ← Volver
        </button>
        <h2>Mi Empresa</h2>
      </div>

      <div className="company-info-card">
        <h3>Información Básica</h3>
        <div className="info-row">
          <strong>Nombre de la Empresa:</strong>
          <span>{clientInfo?.company_name || 'No especificado'}</span>
        </div>
        <div className="info-row">
          <strong>Teléfono:</strong>
          <span>{clientInfo?.phone || 'No especificado'}</span>
        </div>
        <div className="info-row">
          <strong>Dirección:</strong>
          <span>{clientInfo?.address || 'No especificado'}</span>
        </div>
        {clientInfo?.rut_empresa && (
          <div className="info-row">
            <strong>RUT Empresa:</strong>
            <span>{clientInfo.rut_empresa}</span>
          </div>
        )}
      </div>

      {extendedInfo && (
        <>
          <div className="company-info-card">
            <h3>Estado Tributario</h3>
            <div className="info-row">
              <strong>Estado IVA:</strong>
              <span className={`status-badge status-${extendedInfo.iva_declaration_status || 'sin_movimiento'}`}>
                {extendedInfo.iva_declaration_status || 'Sin movimiento'}
              </span>
            </div>
            {extendedInfo.last_iva_declaration_date && (
              <div className="info-row">
                <strong>Última Declaración:</strong>
                <span>{new Date(extendedInfo.last_iva_declaration_date).toLocaleDateString('es-CL')}</span>
              </div>
            )}
            {extendedInfo.next_iva_declaration_due && (
              <div className="info-row">
                <strong>Próxima Declaración:</strong>
                <span>{new Date(extendedInfo.next_iva_declaration_due).toLocaleDateString('es-CL')}</span>
              </div>
            )}
          </div>

          {extendedInfo.legal_info && Object.keys(extendedInfo.legal_info).length > 0 && (
            <div className="company-info-card">
              <h3>Información Legal</h3>
              {Object.entries(extendedInfo.legal_info).map(([key, value]) => (
                <div key={key} className="info-row">
                  <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="company-info-card">
        <h3>Mis Notas</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe tus notas aquí..."
          rows={6}
          className="notes-textarea"
        />
        <button onClick={handleSaveNotes} className="save-button" disabled={saving}>
          {saving ? 'Guardando...' : '💾 Guardar Notas'}
        </button>
      </div>
    </div>
  );
}

interface ClientRequestsSectionProps {
  userId: string;
  userRole: 'cliente' | 'inclusion';
  onBack: () => void;
}

export function ClientRequestsSection({ userId, userRole, onBack }: ClientRequestsSectionProps) {
  const [wheelchairRequests, setWheelchairRequests] = useState<any[]>([]);
  const [transportRequests, setTransportRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wheelchair' | 'transport'>('wheelchair');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [wheelchair, transport] = await Promise.all([
        getWorkshopRequestsByUserId(userId),
        userRole === 'inclusion' ? getTransportRequestsByUserId(userId) : Promise.resolve([]),
      ]);
      setWheelchairRequests(wheelchair);
      setTransportRequests(transport);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [userId, userRole]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      pending: { text: 'Pendiente', class: 'status-pending' },
      confirmed: { text: 'Confirmada', class: 'status-approved' },
      in_progress: { text: 'En Progreso', class: 'status-in-progress' },
      completed: { text: 'Completada', class: 'status-completed' },
      cancelled: { text: 'Cancelada', class: 'status-cancelled' },
      rejected: { text: 'Rechazada', class: 'status-rejected' },
    };
    const badge = badges[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  return (
    <div className="client-section">
      <div className="section-header">
        <button onClick={onBack} className="back-button">
          ← Volver
        </button>
        <h2>Mis Solicitudes</h2>
      </div>

      {userRole === 'inclusion' && (
        <div className="requests-tabs">
          <button
            className={activeTab === 'wheelchair' ? 'active' : ''}
            onClick={() => setActiveTab('wheelchair')}
          >
            🪑 Taller de Sillas
          </button>
          <button
            className={activeTab === 'transport' ? 'active' : ''}
            onClick={() => setActiveTab('transport')}
          >
            🚐 Transporte
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando solicitudes...</p>
        </div>
      ) : (
        <>
          {activeTab === 'wheelchair' && (
            <div className="requests-list">
              {wheelchairRequests.length === 0 ? (
                <div className="empty-state">
                  <p>No tienes solicitudes del taller de sillas.</p>
                </div>
              ) : (
                wheelchairRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <h3>{request.service_type}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <p>{request.service_description}</p>
                    {request.preferred_date && (
                      <div className="request-details">
                        <span>📅 {formatDate(request.preferred_date)}</span>
                        {request.preferred_time && <span>⏰ {request.preferred_time}</span>}
                      </div>
                    )}
                    {request.admin_notes && (
                      <div className="admin-notes">
                        <strong>Notas:</strong> {request.admin_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'transport' && userRole === 'inclusion' && (
            <div className="requests-list">
              {transportRequests.length === 0 ? (
                <div className="empty-state">
                  <p>No tienes solicitudes de transporte.</p>
                </div>
              ) : (
                transportRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <h3>Viaje: {request.trip_type}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <p>
                      <strong>Origen:</strong> {request.origin_address}
                    </p>
                    <p>
                      <strong>Destino:</strong> {request.destination_address}
                    </p>
                    <div className="request-details">
                      <span>📅 {formatDate(request.trip_date)}</span>
                      {request.trip_time && <span>⏰ {request.trip_time}</span>}
                    </div>
                    {request.admin_notes && (
                      <div className="admin-notes">
                        <strong>Notas:</strong> {request.admin_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ClientNotesSectionProps {
  userId: string;
  onBack: () => void;
}

export function ClientNotesSection({ userId, onBack }: ClientNotesSectionProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const { getOrCreateClientInfo } = await import('../lib/clientInfo');
      const { getClientExtendedInfo } = await import('../lib/clientExtendedInfo');
      const [clientInfo, extendedInfo] = await Promise.all([
        getOrCreateClientInfo(userId),
        getClientExtendedInfo(userId),
      ]);
      setNotes(extendedInfo?.notes || clientInfo?.notes || '');
    } catch (error) {
      console.error('Error al cargar notas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { updateClientInfo } = await import('../lib/clientInfo');
      const { upsertClientExtendedInfo } = await import('../lib/clientExtendedInfo');
      const { getClientExtendedInfo } = await import('../lib/clientExtendedInfo');
      
      const extendedInfo = await getClientExtendedInfo(userId);
      if (extendedInfo) {
        await upsertClientExtendedInfo(userId, { notes });
      } else {
        await updateClientInfo(userId, { notes });
      }
      alert('Notas guardadas correctamente.');
    } catch (error) {
      console.error('Error al guardar notas:', error);
      alert('Error al guardar las notas.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="client-section">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando notas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-section">
      <div className="section-header">
        <button onClick={onBack} className="back-button">
          ← Volver
        </button>
        <h2>Mis Notas</h2>
      </div>

      <div className="notes-container">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe tus notas aquí. Puedes guardar información importante, recordatorios, o cualquier cosa que necesites recordar."
          rows={20}
          className="notes-textarea"
        />
        <button onClick={handleSave} className="save-button" disabled={saving}>
          {saving ? 'Guardando...' : '💾 Guardar Notas'}
        </button>
      </div>
    </div>
  );
}

interface ClientProfileSectionProps {
  userId: string;
  userEmail: string;
  userName?: string;
  onBack: () => void;
}

export function ClientProfileSection({ userId, userEmail, userName, onBack }: ClientProfileSectionProps) {
  return (
    <div className="client-section">
      <div className="section-header">
        <button onClick={onBack} className="back-button">
          ← Volver
        </button>
        <h2>👤 Mi Perfil</h2>
      </div>

      <div className="profile-section-content">
        <UserProfile 
          userId={userId}
          userEmail={userEmail}
          userName={userName}
          onUpdate={() => {
            // Recargar datos si es necesario
          }}
        />
      </div>
    </div>
  );
}

