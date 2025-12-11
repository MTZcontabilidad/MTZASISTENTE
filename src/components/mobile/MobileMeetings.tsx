import React, { useState } from 'react';
import './Mobile.css';

const MobileMeetings: React.FC = () => {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState('25');
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleJoinMeeting = (meetingTitle: string) => {
        showToast(`Uniéndose a ${meetingTitle}...`);
        setTimeout(() => {
            window.location.href = "https://meet.google.com"; 
        }, 1500);
    };

    const handleSchedule = () => {
        setShowScheduleModal(true);
    };

    const confirmSchedule = () => {
        setShowScheduleModal(false);
        showToast("¡Reunión agendada con éxito!");
    };

    const handleCalendarNav = (direction: 'next' | 'prev') => {
        showToast(`Navegando al ${direction === 'next' ? 'siguiente' : 'anterior'} mes...`);
    };

    // Helper to render days dynamically
    const renderCalendarDays = () => {
        const days = [
            { day: 'LUN', date: '23' },
            { day: 'MAR', date: '24' },
            { day: 'MIE', date: '25' },
            { day: 'JUE', date: '26' },
            { day: 'VIE', date: '27' },
        ];

        return days.map(item => (
            <div 
                key={item.date}
                className={`calendar-day-item ${selectedDate === item.date ? 'active' : ''}`}
                onClick={() => setSelectedDate(item.date)}
                style={selectedDate === item.date ? { 
                    boxShadow: '0 0 15px rgba(0, 212, 255, 0.4)', 
                    background: 'linear-gradient(to bottom, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.2))' 
                } : {}}
            >
                <span className="day-name" style={{ color: selectedDate === item.date ? 'var(--neon-blue)' : '#9ca3af' }}>{item.day}</span>
                <span className="day-number" style={{ color: selectedDate === item.date ? 'white' : '#d1d5db' }}>{item.date}</span>
            </div>
        ));
    };

    return (
        <div className="mobile-view-container relative">
            {toastMessage && (
                <div style={{
                    position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(59, 130, 246, 0.9)', color: 'white', padding: '0.75rem 1.5rem',
                    borderRadius: '2rem', zIndex: 100, fontSize: '0.875rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    whiteSpace: 'nowrap', backdropFilter: 'blur(4px)'
                }}>
                    {toastMessage}
                </div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="premium-card w-full max-w-sm p-6 rounded-2xl animate-scale-in" style={{ backgroundColor: '#111827', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                        <h3 className="section-title text-center mb-4">Agendar Reunión</h3>
                        <div className="flex flex-col gap-4">
                            <div className="glass-input-wrapper">
                                <input type="text" placeholder="Título de la reunión" className="w-full bg-transparent text-white p-2 outline-none" autoFocus />
                            </div>
                            <div className="glass-input-wrapper">
                                <input type="datetime-local" className="w-full bg-transparent text-white p-2 outline-none" style={{ colorScheme: 'dark' }} />
                            </div>
                            <div className="glass-input-wrapper">
                                <textarea placeholder="Descripción (opcional)" className="w-full bg-transparent text-white p-2 outline-none h-20" />
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setShowScheduleModal(false)} className="mobile-btn-ghost flex-1 justify-center">Cancelar</button>
                                <button onClick={confirmSchedule} className="mobile-btn-primary flex-1 justify-center">Agendar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mobile-scroll-content" style={{ paddingTop: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Octubre 2023</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="mobile-icon-btn" style={{ padding: '0.25rem', background: 'transparent' }} onClick={() => handleCalendarNav('prev')}>
                                <span className="material-icons-round">chevron_left</span>
                            </button>
                            <button className="mobile-icon-btn" style={{ padding: '0.25rem', background: 'transparent' }} onClick={() => handleCalendarNav('next')}>
                                <span className="material-icons-round">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Calendar Strip */}
                    <div className="calendar-strip calendar-strip-modern animate-slide-in" style={{ animationDelay: '0.1s' }}>
                        {renderCalendarDays()}
                    </div>
                </div>

                {selectedDate === '25' ? (
                    <div className="animate-slide-in" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', animationDelay: '0.2s' }}>
                        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)', animation: 'pulse-glow 2s infinite' }}></span>
                            En curso
                        </h3>
                        
                        <div className="mobile-card meeting-card-live premium-card" style={{ border: '1px solid rgba(0, 212, 255, 0.3)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div className="time-badge" style={{ background: 'rgba(0, 212, 255, 0.15)', borderColor: 'rgba(0, 212, 255, 0.3)' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>timer</span>
                                        15 min restantes
                                    </div>
                                    <button style={{ color: '#9ca3af', background: 'none', border: 'none' }}>
                                        <span className="material-icons-round">more_horiz</span>
                                    </button>
                                </div>
                                
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem', lineHeight: 1.3 }}>Revisión Mensual de KPIs</h2>
                                    <p style={{ fontSize: '0.875rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>schedule</span>
                                        10:00 AM - 11:30 AM
                                    </p>
                                </div>

                                <button 
                                    className="mobile-btn-primary"
                                    style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)' }}
                                    onClick={() => handleJoinMeeting('Revisión KPIs')}
                                >
                                    <span className="material-icons-round" style={{ fontSize: '1.125rem' }}>videocam</span>
                                    Unirse
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <h3 className="section-title">Resto del día</h3>
                            <div className="mobile-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '3.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>13:00</span>
                                    <span style={{ fontSize: '0.625rem', color: '#4b5563' }}>PM</span>
                                </div>
                                <div style={{ width: '2px', height: '2.5rem', backgroundColor: '#374151', borderRadius: '9999px' }}></div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.875rem' }}>Almuerzo de Equipo</h4>
                                    <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Restaurante La Plaza</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                        <span className="material-icons-round" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>event_available</span>
                        <p>No hay reuniones programadas para este día.</p>
                        <button onClick={handleSchedule} style={{ color: 'var(--neon-blue)', marginTop: '1rem', background: 'none', border: 'none', fontWeight: 600 }}>
                            + Agendar una reunión
                        </button>
                    </div>
                )}
            </div>

             {/* Floating Action Button */}
             <div style={{ position: 'fixed', bottom: '80px', right: '1.25rem', zIndex: 30 }}>
                <button 
                    onClick={handleSchedule}
                    style={{ width: '3.5rem', height: '3.5rem', backgroundColor: 'var(--neon-blue)', borderRadius: '50%', boxShadow: '0 0 20px rgba(0, 180, 216, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                >
                    <span className="material-icons-round" style={{ fontSize: '1.875rem' }}>add</span>
                </button>
            </div>
        </div>
    );
};

export default MobileMeetings;
