import React, { useState } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

const UsersView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="animate-slide-in">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            <button onClick={onBack} className="mobile-icon-btn" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <span className="material-icons-round">arrow_back</span>
            </button>
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>Usuarios</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
                { id: 1, name: "Juan Pérez", role: "Cliente", status: "active" },
                { id: 2, name: "Maria Gonzalez", role: "Admin", status: "active" },
                { id: 3, name: "Carlos Ruiz", role: "Inclusión", status: "pending" },
            ].map(user => (
                <div key={user.id} className="premium-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons-round" style={{ fontSize: '1.25rem', color: '#9ca3af' }}>person</span>
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: 600 }}>{user.name}</div>
                            <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{user.role}</div>
                        </div>
                    </div>
                    <span className={`material-icons-round`} style={{ color: user.status === 'active' ? '#4ade80' : '#fb923c' }}>
                        {user.status === 'active' ? 'check_circle' : 'pending'}
                    </span>
                </div>
            ))}
        </div>
        <button className="mobile-btn-primary" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}>
            <span className="material-icons-round">person_add</span>
            Nuevo Usuario
        </button>
    </div>
);

const RequestsView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="animate-slide-in">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            <button onClick={onBack} className="mobile-icon-btn" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <span className="material-icons-round">arrow_back</span>
            </button>
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>Solicitudes</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
                { id: 1, type: "Traslado", user: "Ana López", time: "Hace 10 min", icon: "directions_car" },
                { id: 2, type: "Documento", user: "Pedro Dias", time: "Hace 1 hora", icon: "description" },
            ].map(req => (
                <div key={req.id} className="premium-card" style={{ padding: '1rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="material-icons-round" style={{ color: '#60a5fa' }}>{req.icon}</span>
                            <span style={{ color: 'white', fontWeight: 600 }}>{req.type}</span>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{req.time}</span>
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        Solicitud de {req.user}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="mobile-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.875rem' }}>Rechazar</button>
                        <button className="mobile-btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.875rem' }}>Aprobar</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const MobileAdmin: React.FC = () => {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'requests'>('dashboard');

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const adminModules = [
        { id: 'users', label: 'Usuarios', icon: 'group', color: 'blue', view: 'users' },
        { id: 'meetings', label: 'Reuniones', icon: 'event', color: 'purple' },
        { id: 'documents', label: 'Documentos', icon: 'description', color: 'green' },
        { id: 'faqs', label: 'FAQs', icon: 'quiz', color: 'orange' },
        { id: 'company', label: 'Empresa', icon: 'business', color: 'gray' },
        { id: 'requests', label: 'Solicitudes', icon: 'notifications_active', color: 'red', view: 'requests' }
    ];

    const handleModuleClick = (module: any) => {
        if (module.view) {
            setCurrentView(module.view as any);
        } else {
            showToast(`Módulo ${module.label}: Próximamente`);
        }
    };

    return (
        <div className="mobile-view-container relative">
            {toastMessage && (
                <div style={{
                    position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(59, 130, 246, 0.9)', color: 'white', padding: '0.75rem 1.5rem',
                    borderRadius: '2rem', zIndex: 100, fontSize: '0.875rem', backdropFilter: 'blur(4px)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', whiteSpace: 'nowrap'
                }}>
                    {toastMessage}
                </div>
            )}

            <div className="mobile-scroll-content" style={{ paddingTop: '1.5rem' }}>
                {currentView === 'dashboard' ? (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }} className="animate-slide-in">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Panel de Administración</h2>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Gestión centralizada</p>
                        </div>
                        
                        <div className="admin-grid animate-slide-in" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(2, 1fr)', 
                            gap: '0.75rem',
                            animationDelay: '0.1s' 
                        }}>
                            {adminModules.map((module) => (
                                <button 
                                    key={module.id}
                                    className="premium-card"
                                    style={{ 
                                        padding: '1rem', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        textAlign: 'center',
                                        gap: '0.75rem',
                                        borderRadius: '1rem',
                                        background: 'rgba(30, 41, 59, 0.6)'
                                    }}
                                    onClick={() => handleModuleClick(module)}
                                >
                                    <div style={{ 
                                        padding: '0.75rem', 
                                        borderRadius: '0.75rem', 
                                        backgroundColor: `rgba(${
                                            module.color === 'blue' ? '59, 130, 246' : 
                                            module.color === 'purple' ? '168, 85, 247' : 
                                            module.color === 'green' ? '34, 197, 94' : 
                                            module.color === 'orange' ? '249, 115, 22' : 
                                            module.color === 'red' ? '239, 68, 68' : '107, 114, 128'
                                        }, 0.1)`, 
                                        color: module.color === 'blue' ? '#60a5fa' : 
                                               module.color === 'purple' ? '#c084fc' : 
                                               module.color === 'green' ? '#4ade80' : 
                                               module.color === 'orange' ? '#fb923c' : 
                                               module.color === 'red' ? '#f87171' : '#9ca3af'
                                    }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.5rem' }}>{module.icon}</span>
                                    </div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e5e7eb' }}>{module.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="animate-slide-in" style={{ marginTop: '2rem', animationDelay: '0.2s' }}>
                            <h3 className="section-title">Resumen Rápido</h3>
                            <div className="premium-card" style={{ padding: '1rem', borderRadius: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Usuarios Activos</span>
                                    <span style={{ color: 'white', fontWeight: 700 }}>124</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem' }}>
                                    <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Tickets Pendientes</span>
                                    <span style={{ color: '#f87171', fontWeight: 700 }}>3</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : currentView === 'users' ? (
                    <UsersView onBack={() => setCurrentView('dashboard')} />
                ) : currentView === 'requests' ? (
                    <RequestsView onBack={() => setCurrentView('dashboard')} />
                ) : null}
            </div>
        </div>
    );
};

export default MobileAdmin;
