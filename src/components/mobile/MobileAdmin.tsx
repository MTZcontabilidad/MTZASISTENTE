import React, { useState } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

// Helper to show toasts (duplicated from other mobile components for self-containment)
// In a real app we'd use a context.
const MobileAdmin: React.FC = () => {
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const adminModules = [
        { id: 'users', label: 'Usuarios', icon: 'group', color: 'blue' },
        { id: 'meetings', label: 'Reuniones', icon: 'event', color: 'purple' },
        { id: 'documents', label: 'Documentos', icon: 'description', color: 'green' },
        { id: 'faqs', label: 'FAQs', icon: 'quiz', color: 'orange' },
        { id: 'company', label: 'Empresa', icon: 'business', color: 'gray' },
        { id: 'requests', label: 'Solicitudes', icon: 'notifications_active', color: 'red' }
    ];

    const handleModuleClick = (moduleName: string) => {
        showToast(`Módulo ${moduleName}: Próximamente en móvil`);
    };

    return (
        <div className="mobile-view-container relative">
            {toastMessage && (
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(59, 130, 246, 0.9)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '2rem',
                    zIndex: 100,
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(4px)'
                }}>
                    {toastMessage}
                </div>
            )}

            {/* Header removed for consistency, content starts with padding */}
            <div className="mobile-scroll-content" style={{ paddingTop: '1.5rem' }}>
                <h2 className="section-title" style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1.5rem' }}>
                    Panel de Administración
                </h2>

                <div className="grid-2">
                    {adminModules.map((module) => (
                        <button 
                            key={module.id}
                            className="mobile-card" 
                            onClick={() => handleModuleClick(module.label)}
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                padding: '1.5rem', 
                                cursor: 'pointer',
                                gap: '0.75rem',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            <div style={{ 
                                padding: '0.75rem', 
                                backgroundColor: `rgba(${
                                    module.color === 'blue' ? '59, 130, 246' : 
                                    module.color === 'purple' ? '168, 85, 247' : 
                                    module.color === 'green' ? '34, 197, 94' : 
                                    module.color === 'orange' ? '249, 115, 22' : 
                                    module.color === 'red' ? '239, 68, 68' : '107, 114, 128'
                                }, 0.1)`, 
                                borderRadius: '50%', 
                                color: 
                                    module.color === 'blue' ? '#60a5fa' : 
                                    module.color === 'purple' ? '#c084fc' : 
                                    module.color === 'green' ? '#4ade80' : 
                                    module.color === 'orange' ? '#fb923c' : 
                                    module.color === 'red' ? '#f87171' : '#9ca3af',
                                display: 'flex' 
                            }}>
                                <span className="material-icons-round" style={{ fontSize: '2rem' }}>{module.icon}</span>
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e5e7eb' }}>{module.label}</span>
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">Resumen del Sistema</h3>
                    <div className="mobile-card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Usuarios Totales</span>
                            <span style={{ color: 'white', fontWeight: 700 }}>--</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Reuniones Hoy</span>
                            <span style={{ color: 'white', fontWeight: 700 }}>--</span>
                        </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Solicitudes Pendientes</span>
                            <span style={{ color: '#f87171', fontWeight: 700 }}>--</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileAdmin;
