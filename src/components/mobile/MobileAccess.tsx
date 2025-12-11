import React from 'react';
import './Mobile.css';

const MobileAccess: React.FC = () => {
    return (
        <div className="mobile-view-container">
            <header className="mobile-header">
                <h1 className="mobile-title">MTZ Ouroborus AI</h1>
                <p className="mobile-subtitle">Tu asistente virtual de MTZ</p>
            </header>

            <div className="mobile-scroll-content">
                <div className="mobile-input-group">
                    <span className="mobile-input-icon material-icons-round">search</span>
                    <input 
                        className="mobile-input" 
                        placeholder="Buscar trámites, impuestos o servicios..."
                        type="text"
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h2 className="section-title">Destacados</h2>
                    <div className="grid-2">
                        <button className="mobile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}>
                            <div className="access-icon-large">
                                <span className="material-icons-round">account_balance</span>
                            </div>
                            <div className="access-highlight-icon">
                                <span className="material-icons-round">account_balance</span>
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'white', zIndex: 10 }}>Impuestos Internos</span>
                            <span style={{ fontSize: '0.625rem', color: '#9ca3af', lineHeight: 1.25, zIndex: 10, textAlign: 'left' }}>Declaraciones y pagos</span>
                        </button>

                        <button className="mobile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}>
                            <div className="access-icon-large">
                                <span className="material-icons-round">savings</span>
                            </div>
                            <div className="access-highlight-icon">
                                <span className="material-icons-round">savings</span>
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'white', zIndex: 10 }}>Imposiciones</span>
                            <span style={{ fontSize: '0.625rem', color: '#9ca3af', lineHeight: 1.25, zIndex: 10, textAlign: 'left' }}>Certificados y pagos</span>
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="section-title">Herramientas Administrativas</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button className="mobile-card access-list-item">
                            <div className="icon-box">
                                <span className="material-icons-round">receipt_long</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>Facturación Electrónica</div>
                                <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Emisión y consultas</div>
                            </div>
                            <span className="material-icons-round" style={{ color: '#6b7280' }}>chevron_right</span>
                        </button>

                        <button className="mobile-card access-list-item">
                            <div className="icon-box">
                                <span className="material-icons-round">badge</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>Carpeta Tributaria</div>
                                <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Documentación oficial</div>
                            </div>
                            <span className="material-icons-round" style={{ color: '#6b7280' }}>chevron_right</span>
                        </button>

                        <button className="mobile-card access-list-item">
                            <div className="icon-box">
                                <span className="material-icons-round">gavel</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>Registro de Marcas</div>
                                <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Propiedad intelectual</div>
                            </div>
                            <span className="material-icons-round" style={{ color: '#6b7280' }}>chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileAccess;
