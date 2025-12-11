import React from 'react';
import './Mobile.css';

const MobileMeetings: React.FC = () => {
    return (
        <div className="mobile-view-container">
            <header className="mobile-header">
                <h1 className="mobile-title">MTZ Ouroborus AI</h1>
                <p className="mobile-subtitle">Tu asistente virtual de MTZ</p>
            </header>

            <div className="mobile-scroll-content">
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Octubre 2023</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="mobile-icon-btn" style={{ padding: '0.25rem', background: 'transparent' }}>
                                <span className="material-icons-round">chevron_left</span>
                            </button>
                            <button className="mobile-icon-btn" style={{ padding: '0.25rem', background: 'transparent' }}>
                                <span className="material-icons-round">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Calendar Strip */}
                    <div className="calendar-strip">
                         {/* Static Day Items for Demo */}
                        <div className="calendar-day-item">
                            <span className="day-name">LUN</span>
                            <span className="day-number">23</span>
                        </div>
                        <div className="calendar-day-item">
                            <span className="day-name">MAR</span>
                            <span className="day-number">24</span>
                        </div>
                        <div className="calendar-day-item active">
                            <span className="day-name">MIE</span>
                            <span className="day-number">25</span>
                        </div>
                         <div className="calendar-day-item">
                            <span className="day-name">JUE</span>
                            <span className="day-number">26</span>
                        </div>
                        <div className="calendar-day-item">
                            <span className="day-name">VIE</span>
                            <span className="day-number">27</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}></span>
                        En curso
                    </h3>
                    
                    <div className="mobile-card meeting-card-live">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="time-badge">
                                    <span className="material-icons-round" style={{ fontSize: '1rem' }}>timer</span>
                                    15 min restantes
                                </div>
                                <button style={{ color: '#9ca3af', background: 'none', border: 'none' }}>
                                    <span className="material-icons-round">more_horiz</span>
                                </button>
                            </div>
                            
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem', lineHeight: 1.3 }}>Revisión Mensual de KPIs con Equipo de Diseño</h2>
                                <p style={{ fontSize: '0.875rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1rem' }}>schedule</span>
                                    10:00 AM - 11:30 AM
                                </p>
                            </div>

                            <button className="mobile-btn-primary">
                                <span className="material-icons-round" style={{ fontSize: '1.125rem' }}>videocam</span>
                                Unirse
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 className="section-title">Resto del día</h3>
                    
                    {/* Event Item */}
                    <div className="mobile-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '3.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>13:00</span>
                            <span style={{ fontSize: '0.625rem', color: '#4b5563' }}>PM</span>
                        </div>
                        <div style={{ width: '2px', height: '2.5rem', backgroundColor: '#374151', borderRadius: '9999px' }}></div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.875rem' }}>Almuerzo de Equipo</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                                <span className="material-icons-round" style={{ fontSize: '0.75rem', color: '#4b5563' }}>place</span>
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Restaurante La Plaza</p>
                            </div>
                        </div>
                    </div>

                    {/* Event Item */}
                    <div className="mobile-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '3.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>15:30</span>
                            <span style={{ fontSize: '0.625rem', color: '#4b5563' }}>PM</span>
                        </div>
                        <div style={{ width: '2px', height: '2.5rem', backgroundColor: 'rgba(124, 58, 237, 0.4)', borderRadius: '9999px' }}></div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.875rem' }}>Brainstorming Proyecto X</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                                <span className="material-icons-round" style={{ fontSize: '0.75rem', color: '#4b5563' }}>meeting_room</span>
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Sala de Juntas B</p>
                            </div>
                        </div>
                         <span className="material-icons-round" style={{ color: '#4b5563' }}>chevron_right</span>
                    </div>
                </div>
            </div>

             {/* Floating Action Button */}
             <div style={{ position: 'fixed', bottom: '80px', right: '1.25rem', zIndex: 30 }}>
                <button style={{ width: '3.5rem', height: '3.5rem', backgroundColor: 'var(--neon-blue)', borderRadius: '50%', boxShadow: '0 0 20px rgba(0, 180, 216, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                    <span className="material-icons-round" style={{ fontSize: '1.875rem' }}>add</span>
                </button>
            </div>
        </div>
    );
};

export default MobileMeetings;
