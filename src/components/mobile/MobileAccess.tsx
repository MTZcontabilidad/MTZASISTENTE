import React, { useState, useEffect } from 'react';
import './Mobile.css';

const ADMINISTRATIVE_TOOLS = [
    { id: 'facturacion', title: 'Facturación Electrónica', subtitle: 'Emisión y consultas', icon: 'receipt_long', url: 'https://homer.sii.cl/' },
    { id: 'carpeta', title: 'Carpeta Tributaria', subtitle: 'Documentación oficial', icon: 'badge', url: 'https://zeus.sii.cl/autor/carpeta_tributaria/index.html' },
    { id: 'marcas', title: 'Registro de Marcas', subtitle: 'Propiedad intelectual', icon: 'gavel', url: 'https://www.inapi.cl/' },
    { id: 'rrhh', title: 'Recursos Humanos', subtitle: 'Contratos y finiquitos', icon: 'groups', url: 'https://www.dt.gob.cl/portal/1626/w3-channel.html' },
];

const HIGHLIGHTS = [
    { id: 'impuestos', title: 'Impuestos Internos', subtitle: 'Declaraciones y pagos', icon: 'account_balance', url: 'https://homer.sii.cl/' },
    { id: 'imposiciones', title: 'Previred', subtitle: 'Certificados y pagos', icon: 'savings', url: 'https://www.previred.com/' },
];

const MobileAccess: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [recentTools, setRecentTools] = useState<any[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('recentTools');
        if (stored) {
            setRecentTools(JSON.parse(stored));
        }
    }, []);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleAccessClick = (tool: any) => {
        showToast(`Abriendo ${tool.title}...`);
        
        const newRecents = [tool, ...recentTools.filter(t => t.id !== tool.id)].slice(0, 3);
        setRecentTools(newRecents);
        localStorage.setItem('recentTools', JSON.stringify(newRecents));

        setTimeout(() => {
            if (tool.url) {
                window.open(tool.url, '_blank', 'noopener,noreferrer');
            }
        }, 800);
    };

    const filteredTools = ADMINISTRATIVE_TOOLS.filter(tool => 
        tool.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tool.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const showHighlights = !searchTerm;

    return (
        <div id="mobile-app-root">
            <div className="mobile-view-container">
                {toastMessage && (
                    <div className="status-badge success floating-toast">
                        {toastMessage}
                    </div>
                )}

                <div className="mobile-content-scroll">
                    <div className="form-group animate-slide-in" style={{ animationDelay: '0s' }}>
                        <div className="glass-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-icons-round" style={{ color: 'var(--mobile-text-secondary)' }}>search</span>
                            <input 
                                className="mobile-input" 
                                placeholder="Buscar trámites, impuestos..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {showHighlights && recentTools.length > 0 && (
                        <div className="mb-6 animate-slide-in" style={{ animationDelay: '0.05s' }}>
                            <h2 className="section-label">Recientes</h2>
                            <div className="category-tags">
                                {recentTools.map((tool) => (
                                    <button 
                                        key={tool.id}
                                        className="premium-card flex-col-center"
                                        style={{ 
                                            minWidth: '8rem', 
                                            padding: '0.75rem',
                                            gap: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleAccessClick(tool)}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '1.5rem', color: '#60a5fa' }}>{tool.icon}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{tool.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {showHighlights && (
                        <div className="mb-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                            <h2 className="section-label">Destacados</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {HIGHLIGHTS.map((highlight) => (
                                    <button 
                                        key={highlight.id}
                                        className="premium-card" 
                                        style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'flex-start', 
                                            position: 'relative', 
                                            overflow: 'hidden',
                                            padding: '1rem',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleAccessClick(highlight)}
                                    >
                                        <div style={{ 
                                            position: 'absolute', 
                                            bottom: '-1rem', 
                                            right: '-1rem', 
                                            fontSize: '4rem', 
                                            opacity: 0.1,
                                            color: '#60a5fa'
                                        }}>
                                            <span className="material-icons-round" style={{ fontSize: 'inherit' }}>{highlight.icon}</span>
                                        </div>
                                        <div className="item-icon-box" style={{ marginBottom: '0.5rem' }}>
                                            <span className="material-icons-round">{highlight.icon}</span>
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'white', zIndex: 10 }}>{highlight.title}</span>
                                        <span style={{ fontSize: '0.625rem', color: '#9ca3af', lineHeight: 1.25, zIndex: 10, textAlign: 'left' }}>{highlight.subtitle}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
                        <h2 className="section-label">{searchTerm ? 'Resultados' : 'Herramientas Administrativas'}</h2>
                        <div className="premium-card-list">
                            {filteredTools.length > 0 ? filteredTools.map(tool => (
                                <button 
                                    key={tool.id}
                                    className="premium-item"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleAccessClick(tool)}
                                >
                                    <div className="item-icon-box">
                                        <span className="material-icons-round">{tool.icon}</span>
                                    </div>
                                    <div className="item-content">
                                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>{tool.title}</div>
                                        <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>{tool.subtitle}</div>
                                    </div>
                                    <span className="material-icons-round" style={{ color: '#6b7280' }}>chevron_right</span>
                                </button>
                            )) : (
                                <div className="empty-state">
                                    No se encontraron herramientas.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileAccess;
