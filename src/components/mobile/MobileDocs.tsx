import React from 'react';
import './Mobile.css';

const MobileDocs: React.FC = () => {
    return (
        <div className="mobile-view-container">
            <header className="mobile-header">
                <h1 className="mobile-title">MTZ Ouroborus AI</h1>
                <p className="mobile-subtitle">Tu asistente virtual de MTZ</p>
            </header>

            <div className="mobile-scroll-content">
                {/* Search Bar */}
                <div className="docs-sticky-header">
                    <div className="mobile-input-group" style={{ marginBottom: '0.5rem' }}>
                        <span className="mobile-input-icon material-icons-round">search</span>
                        <input 
                            className="mobile-input" 
                            placeholder="Buscar por nombre, RUT o fecha..."
                            type="text"
                        />
                        <button style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', padding: '0.375rem', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                             <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>filter_list</span>
                        </button>
                    </div>
                    
                    {/* Tags */}
                    <div className="tag-scroll-container">
                         <button className="tag-btn active">Todos</button>
                         <button className="tag-btn">IVA</button>
                         <button className="tag-btn">Liquidaciones</button>
                         <button className="tag-btn">Imposiciones</button>
                         <button className="tag-btn">Otros</button>
                    </div>
                </div>

                {/* Categories */}
                <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                     <h2 className="section-title">Categorías Principales</h2>
                     <div className="grid-2">
                        <button className="mobile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: '#60a5fa', display: 'flex' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>receipt_long</span>
                                </div>
                                <span className="doc-stats-badge">12 Docs</span>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>IVA (F29)</p>
                                <p style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: '0.125rem', textAlign: 'left' }}>Declaraciones mensuales</p>
                            </div>
                        </button>

                         <button className="mobile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem', color: '#4ade80', display: 'flex' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>payments</span>
                                </div>
                                <span className="doc-stats-badge">24 Docs</span>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>Liquidaciones</p>
                                <p style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: '0.125rem', textAlign: 'left' }}>Sueldos y finiquitos</p>
                            </div>
                        </button>
                     </div>
                </div>

                {/* Recent Docs */}
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h2 className="section-title" style={{ marginBottom: 0 }}>Documentos Recientes</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Filtrar por:</span>
                            <span style={{ fontSize: '0.625rem', color: 'var(--neon-blue)', fontWeight: 500 }}>Fecha</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         <div className="mobile-card" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', marginBottom: 0 }}>
                             <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', flexShrink: 0, marginRight: '0.75rem', position: 'relative' }}>
                                <span className="material-icons-round" style={{ fontSize: '1.5rem' }}>payments</span>
                                <div style={{ position: 'absolute', top: '-0.25rem', right: '-0.25rem', width: '0.625rem', height: '0.625rem', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #111118' }}></div>
                             </div>
                             <div style={{ flex: 1, minWidth: 0 }}>
                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                     <h3 style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f3f4f6' }}>Liquidación Octubre</h3>
                                     <span style={{ fontSize: '0.625rem', color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>Pendiente</span>
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                                     <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>Liquidaciones • 30 Oct</span>
                                 </div>
                             </div>
                             <button style={{ padding: '0.5rem', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>visibility</span>
                             </button>
                         </div>

                          <div className="mobile-card" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', marginBottom: 0 }}>
                             <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0, marginRight: '0.75rem' }}>
                                <span className="material-icons-round" style={{ fontSize: '1.5rem' }}>receipt_long</span>
                             </div>
                             <div style={{ flex: 1, minWidth: 0 }}>
                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                     <h3 style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f3f4f6' }}>Formulario 29 - Sep</h3>
                                     <span style={{ fontSize: '0.625rem', color: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>Declarado</span>
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                                     <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>IVA • 20 Oct</span>
                                 </div>
                             </div>
                             <button style={{ padding: '0.5rem', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>download</span>
                             </button>
                         </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default MobileDocs;
