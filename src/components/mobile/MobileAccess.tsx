import React, { useState, useEffect } from 'react';
import './Mobile.css';

// Mock Data for Search
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
        
        // Update Recents
        const newRecents = [tool, ...recentTools.filter(t => t.id !== tool.id)].slice(0, 3);
        setRecentTools(newRecents);
        localStorage.setItem('recentTools', JSON.stringify(newRecents));

        // Open Link
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

            <div className="mobile-scroll-content">
                <div className="mobile-input-group animate-slide-in" style={{ animationDelay: '0s' }}>
                    <span className="mobile-input-icon material-icons-round">search</span>
                    <input 
                        className="mobile-input glass-input-wrapper" 
                        placeholder="Buscar trámites, impuestos..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {showHighlights && recentTools.length > 0 && (
                    <div className="animate-slide-in" style={{ marginBottom: '1.5rem', animationDelay: '0.05s' }}>
                        <h2 className="section-title">Recientes</h2>
                        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {recentTools.map((tool) => (
                                <button 
                                    key={tool.id}
                                    className="premium-card"
                                    style={{ 
                                        minWidth: '8rem', 
                                        padding: '0.75rem', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        textAlign: 'center',
                                        gap: '0.5rem',
                                        background: 'rgba(30, 41, 59, 0.6)'
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
                    <div className="animate-slide-in" style={{ marginBottom: '1.5rem', animationDelay: '0.1s' }}>
                        <h2 className="section-title">Destacados</h2>
                        <div className="grid-2">
                            {HIGHLIGHTS.map((highlight) => (
                                <button 
                                    key={highlight.id}
                                    className="mobile-card premium-card" 
                                    style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'flex-start', 
                                        position: 'relative', 
                                        overflow: 'hidden',
                                        background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
                                        border: '1px solid rgba(0, 212, 255, 0.1)'
                                    }}
                                    onClick={() => handleAccessClick(highlight)}
                                >
                                    <div className="access-icon-large">
                                        <span className="material-icons-round">{highlight.icon}</span>
                                    </div>
                                    <div className="access-highlight-icon" style={{ boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)' }}>
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
                    <h2 className="section-title">{searchTerm ? 'Resultados' : 'Herramientas Administrativas'}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredTools.length > 0 ? filteredTools.map(tool => (
                            <button 
                                key={tool.id}
                                className="mobile-card access-list-item premium-card"
                                onClick={() => handleAccessClick(tool)}
                            >
                                <div className="icon-box" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(255,255,255,0.05)' }}>
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
