import React, { useState, useEffect } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

const MobileMeetings: React.FC = () => {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Schedule Modal State
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    
    // Derived state for calendar strip
    const startOfWeek = new Date(selectedDate);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('meetings')
                .select('*')
                .eq('user_id', user.id)
                .order('meeting_date', { ascending: true });

            if (error) throw error;
            setMeetings(data || []);
        } catch (error) {
            console.error('Error fetching meetings:', error);
            showToast('Error cargando reuniones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    const handleSchedule = async () => {
        if (!newTitle || !newDate || !newTime) {
            showToast("Completa todos los campos");
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

             const dateTimeStr = `${newDate}T${newTime}:00`;
             const { error } = await supabase
                .from('meetings')
                .insert([{
                    user_id: user.id,
                    title: newTitle,
                    meeting_date: dateTimeStr,
                    duration_minutes: 60,
                    status: 'scheduled',
                    type: 'video' // Default
                }]);

            if (error) throw error;
            showToast("Reunión agendada");
            setShowScheduleModal(false);
            setNewTitle('');
            fetchMeetings();
        } catch (e) {
            console.error(e);
            showToast("Error al crear reunión");
        }
    };

    const renderCalendarStrip = () => {
        const days = [];
        const baseDate = new Date(); 
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() + i);
            const isSelected = d.toDateString() === selectedDate.toDateString();
            
            days.push(
                <button 
                    key={i} 
                    className={`calendar-day ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedDate(d)}
                >
                    <span className="day-name">
                        {d.toLocaleDateString('es-CL', { weekday: 'short' }).slice(0, 3)}
                    </span>
                    <span className="day-number">
                        {d.getDate()}
                    </span>
                </button>
            );
        }
        return <div className="calendar-strip">{days}</div>;
    };

    // Filter meetings for selected date
    const dailyMeetings = meetings.filter(m => 
        new Date(m.meeting_date).toDateString() === selectedDate.toDateString()
    );

    return (
        <div id="mobile-app-root">
             <div className="mobile-view-container">
                 {toastMessage && (
                    <div className="status-badge success animate-fade-in floating-toast">
                        {toastMessage}
                    </div>
                )}

                <header className="glass-header">
                    <div>
                         <h1 className="header-title">Agenda</h1>
                         <p className="header-subtitle">Próximas reuniones</p>
                    </div>
                     <button 
                        onClick={() => setShowScheduleModal(true)}
                        className="header-action-btn"
                    >
                        <span className="material-icons-round">add</span>
                    </button>
                </header>

                <div className="mobile-content-scroll meetings-content">
                    {/* Calendar Strip */}
                    <div className="calendar-section">
                        {renderCalendarStrip()}
                    </div>

                    {loading ? (
                        <div className="loader-container"><div className="loader"></div></div>
                    ) : (
                        <div className="meetings-list">
                             {dailyMeetings.length === 0 ? (
                                <div className="empty-state">
                                    <span className="material-icons-round empty-icon">event_busy</span>
                                    <p>No hay reuniones para este día</p>
                                    <button className="btn-ghost small" onClick={() => setShowScheduleModal(true)}>
                                        + Agendar ahora
                                    </button>
                                </div>
                            ) : (
                                dailyMeetings.map((meeting, idx) => {
                                    const mDate = new Date(meeting.meeting_date);
                                    // Simple "isLive" logic
                                    const isLive = meeting.status === 'En curso' || (
                                        mDate <= new Date() && 
                                        (new Date(mDate.getTime() + (meeting.duration_minutes || 60) * 60000)) > new Date()
                                    );

                                    return (
                                        <div 
                                            key={meeting.id} 
                                            className={`premium-card meeting-card ${isLive ? 'live' : ''} slide-up`}
                                            style={{ animationDelay: `${idx * 0.1}s` }}
                                        >
                                            {isLive && (
                                                <div className="live-badge pulse-animation">
                                                    EN VIVO
                                                </div>
                                            )}
                                            
                                            <div className="card-header">
                                                <div className="meeting-info">
                                                    <div className={`meeting-icon-box ${meeting.type === 'video' ? 'video' : 'local'}`}>
                                                        <span className="material-icons-round">
                                                            {meeting.type === 'video' ? 'videocam' : 'location_on'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="meeting-title">{meeting.title}</h3>
                                                        <div className="meeting-time">
                                                            <span className="material-icons-round icon-tiny">schedule</span>
                                                            {mDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(mDate.getTime() + (meeting.duration_minutes || 60) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card-actions">
                                                {meeting.link && (
                                                    <a 
                                                        href={meeting.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="btn-primary small"
                                                    >
                                                        Unirse
                                                    </a>
                                                )}
                                                <button className="btn-ghost small">
                                                    Detalles
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Schedule Modal */}
                {showScheduleModal && (
                    <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                        <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                            <div className="sheet-header">
                                <h3 className="sheet-title">Agendar Reunión</h3>
                                <button onClick={() => setShowScheduleModal(false)} className="close-btn">
                                    <span className="material-icons-round">close</span>
                                </button>
                            </div>
                            
                            <div className="sheet-content form-stack">
                                <div className="form-group">
                                    <label className="input-label">Título</label>
                                    <input 
                                        className="mobile-input" 
                                        placeholder="Motivo de la reunión" 
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="input-label">Fecha</label>
                                        <input 
                                            type="date" 
                                            className="mobile-input" 
                                            value={newDate}
                                            onChange={e => setNewDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Hora</label>
                                        <input 
                                            type="time" 
                                            className="mobile-input" 
                                            value={newTime}
                                            onChange={e => setNewTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button 
                                    className="btn-primary full-width mt-4"
                                    onClick={handleSchedule}
                                >
                                    Confirmar Agendamiento
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileMeetings;
