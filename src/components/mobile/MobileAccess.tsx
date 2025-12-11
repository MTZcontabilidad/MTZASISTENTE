import React, { useState } from 'react';
import './Mobile.css';

// Mock Data for Search
const ADMINISTRATIVE_TOOLS = [
    { id: 'facturacion', title: 'Facturación Electrónica', subtitle: 'Emisión y consultas', icon: 'receipt_long' },
    { id: 'carpeta', title: 'Carpeta Tributaria', subtitle: 'Documentación oficial', icon: 'badge' },
    { id: 'marcas', title: 'Registro de Marcas', subtitle: 'Propiedad intelectual', icon: 'gavel' },
    { id: 'rrhh', title: 'Recursos Humanos', subtitle: 'Contratos y finiquitos', icon: 'groups' },
];

const HIGHLIGHTS = [
    { id: 'impuestos', title: 'Impuestos Internos', subtitle: 'Declaraciones y pagos', icon: 'account_balance' },
    { id: 'imposiciones', title: 'Imposiciones', subtitle: 'Certificados y pagos', icon: 'savings' },
];

const MobileAccess: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleAccessClick = (title: string) => {
        showToast(`Abriendo ${title}...`);
        // Simulate navigation
        setTimeout(() => {
            // window.location.href = ...
        }, 1000);
    };

    const filteredTools = ADMINISTRATIVE_TOOLS.filter(tool => 
        tool.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tool.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const showHighlights = !searchTerm; // Hide highlights when searching to focus on results

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

            {/* Header removed for space optimization */}
            <div className="mobile-scroll-content" style={{ paddingTop: '1.5rem' }}>
                <div className="mobile-input-group">
                    <span className="mobile-input-icon material-icons-round">search</span>
                    <input 
                        className="mobile-input" 
                        placeholder="Buscar trámites, impuestos..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {showHighlights && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 className="section-title">Destacados</h2>
                        <div className="grid-2">
                            {HIGHLIGHTS.map(highlight => (
                                <button 
                                    key={highlight.id}
                                    className="mobile-card" 
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}
                                    onClick={() => handleAccessClick(highlight.title)}
                                >
                                    <div className="access-icon-large">
                                        <span className="material-icons-round">{highlight.icon}</span>
                                    </div>
                                    <div className="access-highlight-icon">
                                        <span className="material-icons-round">{highlight.icon}</span>
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'white', zIndex: 10 }}>{highlight.title}</span>
                                    <span style={{ fontSize: '0.625rem', color: '#9ca3af', lineHeight: 1.25, zIndex: 10, textAlign: 'left' }}>{highlight.subtitle}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="section-title">{searchTerm ? 'Resultados' : 'Herramientas Administrativas'}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredTools.length > 0 ? filteredTools.map(tool => (
                            <button 
                                key={tool.id}
                                className="mobile-card access-list-item"
                                onClick={() => handleAccessClick(tool.title)}
                            >
                                <div className="icon-box">
                                    <span className="material-icons-round">{tool.icon}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>{tool.title}</div>
                                    <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>{tool.subtitle}</div>
                                </div>
                                <span className="material-icons-round" style={{ color: '#6b7280' }}>chevron_right</span>
                            </button>
                        )) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                No se encontraron herramientas.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileAccess;
