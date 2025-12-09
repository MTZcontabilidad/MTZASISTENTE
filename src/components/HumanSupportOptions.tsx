import { useState } from 'react'
import { MTZ_LINKS, getWhatsAppLink, openLink } from '../config/links'
import './HumanSupportOptions.css'

interface HumanSupportOptionsProps {
  onClose?: () => void
  userMessage?: string
}

function HumanSupportOptions({ onClose, userMessage }: HumanSupportOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<'executive' | 'meeting' | null>(null)
  const [meetingForm, setMeetingForm] = useState({
    date: '',
    time: '',
    topic: userMessage || '',
    contactMethod: 'whatsapp'
  })

  const handleContactExecutive = () => {
    const message = userMessage 
      ? `Hola, necesito hablar con un ejecutivo sobre: ${userMessage}`
      : 'Hola, me gustaría hablar con un ejecutivo'
    
    const whatsappLink = getWhatsAppLink(message)
    openLink(whatsappLink)
    
    if (onClose) onClose()
  }

  const handleScheduleMeeting = () => {
    if (!meetingForm.date || !meetingForm.time) {
      alert('Por favor completa la fecha y hora')
      return
    }

    const message = `Hola, me gustaría agendar una reunión:
📅 Fecha: ${meetingForm.date}
🕐 Hora: ${meetingForm.time}
📋 Tema: ${meetingForm.topic || 'Consulta general'}`

    const whatsappLink = getWhatsAppLink(message)
    openLink(whatsappLink)
    
    if (onClose) onClose()
  }

  const handleEmailContact = () => {
    const subject = encodeURIComponent(userMessage || 'Consulta con ejecutivo')
    const body = encodeURIComponent(
      userMessage 
        ? `Hola,\n\nMe gustaría hablar con un ejecutivo sobre:\n${userMessage}\n\nGracias.`
        : 'Hola,\n\nMe gustaría hablar con un ejecutivo.\n\nGracias.'
    )
    const mailtoLink = `mailto:${MTZ_LINKS.email}?subject=${subject}&body=${body}`
    window.location.href = mailtoLink
    
    if (onClose) onClose()
  }

  if (selectedOption === 'meeting') {
    return (
      <div className="human-support-modal">
        <div className="human-support-content">
          <div className="human-support-header">
            <h3>📅 Agendar Reunión</h3>
            <button onClick={() => setSelectedOption(null)} className="close-button">
              ← Volver
            </button>
          </div>
          
          <div className="meeting-form">
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={meetingForm.date}
                onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Hora</label>
              <input
                type="time"
                value={meetingForm.time}
                onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Tema de la reunión</label>
              <textarea
                value={meetingForm.topic}
                onChange={(e) => setMeetingForm({ ...meetingForm, topic: e.target.value })}
                placeholder="Describe brevemente el tema de la reunión..."
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>Método de contacto preferido</label>
              <select
                value={meetingForm.contactMethod}
                onChange={(e) => setMeetingForm({ ...meetingForm, contactMethod: e.target.value })}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button onClick={handleScheduleMeeting} className="submit-button">
                Agendar Reunión
              </button>
              <button onClick={() => setSelectedOption(null)} className="cancel-button">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="human-support-modal">
      <div className="human-support-content">
        <div className="human-support-header">
          <h3>💬 ¿Necesitas ayuda humana?</h3>
          {onClose && (
            <button onClick={onClose} className="close-button">
              ✕
            </button>
          )}
        </div>
        
        <p className="human-support-description">
          Puedes contactar directamente con uno de nuestros ejecutivos o agendar una reunión
        </p>
        
        <div className="human-support-options">
          <button
            onClick={handleContactExecutive}
            className="support-option-button executive"
          >
            <span className="option-icon">👤</span>
            <div className="option-content">
              <h4>Hablar con Ejecutivo</h4>
              <p>Contacta inmediatamente por WhatsApp</p>
            </div>
          </button>
          
          <button
            onClick={() => setSelectedOption('meeting')}
            className="support-option-button meeting"
          >
            <span className="option-icon">📅</span>
            <div className="option-content">
              <h4>Agendar Reunión</h4>
              <p>Programa una reunión en el horario que prefieras</p>
            </div>
          </button>
          
          <button
            onClick={handleEmailContact}
            className="support-option-button email"
          >
            <span className="option-icon">✉️</span>
            <div className="option-content">
              <h4>Enviar Email</h4>
              <p>Escribe un correo a nuestro equipo</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HumanSupportOptions

