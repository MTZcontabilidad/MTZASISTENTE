import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  getUserMeetings,
  createMeeting,
  cancelMeeting,
} from "../lib/meetings";
import type { Meeting } from "../types";
import type { MeetingInput } from "../types";
import "./MeetingScheduler.css";

interface MeetingSchedulerProps {
  userId: string;
}

function MeetingScheduler({ userId }: MeetingSchedulerProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    loadMeetings();
  }, [userId]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const userMeetings = await getUserMeetings(userId);
      setMeetings(userMeetings);
    } catch (err: any) {
      console.error("Error al cargar reuniones:", err);
      setError("Error al cargar las reuniones");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("El título es requerido");
      return;
    }

    if (!meetingDate || !meetingTime) {
      setError("La fecha y hora son requeridas");
      return;
    }

    // Combinar fecha y hora
    const dateTime = new Date(`${meetingDate}T${meetingTime}`);
    
    // Validar que la fecha no sea en el pasado
    if (dateTime < new Date()) {
      setError("No puedes agendar una reunión en el pasado");
      return;
    }

    try {
      setSubmitting(true);
      const meetingData: MeetingInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        meeting_date: dateTime.toISOString(),
        duration_minutes: duration,
      };

      await createMeeting(userId, meetingData);
      
      // Limpiar formulario
      setTitle("");
      setDescription("");
      setMeetingDate("");
      setMeetingTime("");
      setDuration(30);
      setShowForm(false);
      
      // Recargar reuniones
      await loadMeetings();
    } catch (err: any) {
      console.error("Error al crear reunión:", err);
      setError(err.message || "Error al crear la reunión");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (meetingId: string) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta reunión?")) {
      return;
    }

    try {
      await cancelMeeting(meetingId, userId);
      await loadMeetings();
    } catch (err: any) {
      console.error("Error al cancelar reunión:", err);
      alert("Error al cancelar la reunión");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; class: string }> = {
      pending: { text: "⏳ En espera de confirmación", class: "status-pending" },
      approved: { text: "✅ Confirmada", class: "status-approved" },
      rejected: { text: "❌ Rechazada", class: "status-rejected" },
      cancelled: { text: "🚫 Cancelada", class: "status-cancelled" },
      completed: { text: "✓ Completada", class: "status-completed" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>{config.text}</span>
    );
  };

  // Obtener fecha mínima (hoy)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="meeting-scheduler">
      <div className="meeting-scheduler-header">
        <h2>📅 Mis Reuniones</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? "Cancelar" : "+ Nueva Reunión"}
        </button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {showForm && (
        <div className="meeting-form-container">
          <form onSubmit={handleSubmit} className="meeting-form">
            <h3>Agendar Nueva Reunión</h3>

            <div className="form-group">
              <label>Título de la reunión *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Consulta sobre declaración de impuestos"
                required
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe brevemente el motivo de la reunión..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  min={today}
                  required
                />
              </div>

              <div className="form-group">
                <label>Hora *</label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Duración (minutos)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1.5 horas</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Enviando..." : "Solicitar Reunión"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando reuniones...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="empty-state">
          <p>No tienes reuniones agendadas</p>
          <p className="empty-subtitle">
            Haz clic en "Nueva Reunión" para solicitar una reunión
          </p>
        </div>
      ) : (
        <div className="meetings-list">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="meeting-card">
              <div className="meeting-card-header">
                <h4>{meeting.title}</h4>
                {getStatusBadge(meeting.status)}
              </div>

              {meeting.description && (
                <p className="meeting-description">{meeting.description}</p>
              )}

              <div className="meeting-details">
                <div className="meeting-detail">
                  <strong>📅 Fecha y hora:</strong>
                  <span>{formatDate(meeting.meeting_date)}</span>
                </div>
                <div className="meeting-detail">
                  <strong>⏱️ Duración:</strong>
                  <span>{meeting.duration_minutes} minutos</span>
                </div>
                {meeting.admin_notes && (
                  <div className="meeting-detail admin-notes">
                    <strong>💬 Notas del administrador:</strong>
                    <span>{meeting.admin_notes}</span>
                  </div>
                )}
              </div>

              {meeting.status === "pending" && (
                <div className="meeting-actions">
                  <button
                    onClick={() => handleCancel(meeting.id)}
                    className="btn-danger"
                  >
                    Cancelar Reunión
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MeetingScheduler;

