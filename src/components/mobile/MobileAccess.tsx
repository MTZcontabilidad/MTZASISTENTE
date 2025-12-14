import React, { useState, useEffect } from 'react';
import './Mobile.css';

const ADMINISTRATIVE_TOOLS = [
    // SII
    { id: 'facturacion', title: 'Facturación Electrónica', subtitle: 'Emisión y consultas', icon: 'receipt_long', url: 'https://homer.sii.cl/', category: 'SII' },
    { id: 'carpeta', title: 'Carpeta Tributaria', subtitle: 'Documentación oficial', icon: 'folder_shared', url: 'https://zeus.sii.cl/autor/carpeta_tributaria/index.html', category: 'SII' },
    { id: 'boletas', title: 'Boletas de Honorarios', subtitle: 'Emitir o consultar', icon: 'description', url: 'https://homer.sii.cl/', category: 'SII' },
    { id: 'f29', title: 'Declaración Mensual (F29)', subtitle: 'Pagar IVA', icon: 'calendar_today', url: 'https://homer.sii.cl/', category: 'SII' },
    
    // TGR
    { id: 'tesoreria_pagos', title: 'Pagos y Contribuciones', subtitle: 'Deudas fiscales', icon: 'account_balance_wallet', url: 'https://www.tgr.cl/', category: 'TGR' },
    { id: 'tesoreria_cert', title: 'Certificados de Deuda', subtitle: 'Estado de situación', icon: 'verified', url: 'https://www.tgr.cl/certificados/', category: 'TGR' },

    // DT / Laboral
    { id: 'rrhh_tramites', title: 'Trámites en Línea', subtitle: 'Contratos y constancias', icon: 'work', url: 'https://www.dt.gob.cl/portal/1626/w3-channel.html', category: 'DT' },
    { id: 'previred', title: 'Previred', subtitle: 'Pago de cotizaciones', icon: 'savings', url: 'https://www.previred.com/', category: 'DT' },

    // Legal / Otros
    { id: 'diario', title: 'Diario Oficial', subtitle: 'Publicaciones legales', icon: 'article', url: 'https://www.diariooficial.cl/', category: 'Legal' },
    { id: 'marcas', title: 'INAPI (Marcas)', subtitle: 'Registro de marcas', icon: 'copyright', url: 'https://www.inapi.cl/', category: 'Legal' },
    { id: 'cmf', title: 'CMF Chile', subtitle: 'Mercado financiero', icon: 'account_balance', url: 'https://www.cmfchile.cl/', category: 'Legal' },
];

const HIGHLIGHTS = [
    { id: 'sii_fast', title: 'Mi SII', subtitle: 'Acceso directo', icon: 'account_balance', url: 'https://homer.sii.cl/', color: 'text-blue-400' },
    { id: 'previred_fast', title: 'Previred', subtitle: 'Cotizaciones', icon: 'savings', url: 'https://www.previred.com/', color: 'text-blue-400' },
];

const INSTITUTIONS = [
    { id: 'SII', label: 'Servicio Impuestos Internos', icon: 'account_balance' },
    { id: 'TGR', label: 'Tesorería General', icon: 'account_balance_wallet' },
    { id: 'DT', label: 'Dirección del Trabajo & RRHH', icon: 'work' },
    { id: 'Legal', label: 'Legal & Otros Organismos', icon: 'gavel' },
];

const MobileAccess: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [recentTools, setRecentTools] = useState<any[]>([]);
    
    // Accordion State: "SII" open by default
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        'SII': true, 
        'TGR': false,
        'DT': false,
        'Legal': false
    });

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
        
        const newRecents = [tool, ...recentTools.filter(t => t.id !== tool.id)].slice(0, 5); // Keep last 5
        setRecentTools(newRecents);
        localStorage.setItem('recentTools', JSON.stringify(newRecents));

        setTimeout(() => {
            if (tool.url) {
                window.open(tool.url, '_blank', 'noopener,noreferrer');
            }
        }, 500);
    };

    const toggleCategory = (catId: string) => {
        setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    // Filter tools
    const filteredTools = ADMINISTRATIVE_TOOLS.filter(tool => 
        tool.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tool.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const showHighlights = !searchTerm;

    return (
        <div className="mobile-view-container system-bg-void">
            {toastMessage && (
                <div className="toast-notification success">
                    <span className="material-icons-round text-sm">rocket_launch</span>
                    {toastMessage}
                </div>
            )}

            {/* INTEGRATED HEADER & SEARCH */}
            <div className="glass-header-integrated sticky top-0" style={{ padding: '1.5rem 1.5rem 1.25rem 1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}></div>

                <div className="relative group" style={{ position: 'relative' }}>
                    <span 
                        className="material-icons-round" 
                        style={{
                            position: 'absolute',
                            left: '0.875rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--mobile-text-muted)',
                            fontSize: '1.25rem',
                            zIndex: 1,
                            transition: 'color 0.3s ease'
                        }}
                    >
                        search
                    </span>
                    <input 
                        className="access-search-input"
                        placeholder="Buscar trámites, impuestos o servicios..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.875rem 1rem 0.875rem 2.75rem',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(var(--mobile-bg-rgb), 0.6)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            color: 'var(--mobile-text)',
                            fontSize: '0.9rem',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--mobile-primary)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>
            </div>

            <div className="mobile-content-scroll" style={{ padding: '1.5rem 1rem 6rem 1rem' }}>
                {showHighlights && (
                    <>
                        {/* DESTACADOS */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 className="section-label" style={{ marginBottom: '0.875rem', paddingLeft: '0.25rem' }}>
                                DESTACADOS
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                                {HIGHLIGHTS.map((highlight) => (
                                    <button 
                                        key={highlight.id}
                                        className="highlight-card-compact" 
                                        onClick={() => handleAccessClick(highlight)}
                                    >
                                        <div className="icon-container" style={{
                                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                            borderColor: 'rgba(59, 130, 246, 0.3)'
                                        }}>
                                            <span className="material-icons-round" style={{ 
                                                color: 'var(--mobile-primary)',
                                                fontSize: '1.75rem'
                                            }}>
                                                {highlight.icon}
                                            </span>
                                        </div>
                                        
                                        <div style={{ 
                                            flex: 1, 
                                            textAlign: 'left', 
                                            minWidth: 0 
                                        }}>
                                            <div style={{
                                                fontWeight: 700,
                                                color: 'var(--mobile-text)',
                                                fontSize: '0.875rem',
                                                lineHeight: 1.3,
                                                marginBottom: '0.25rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {highlight.title}
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--mobile-text-muted)',
                                                fontWeight: 500,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {highlight.subtitle}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* INSTITUCIONES / ORGANISMOS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {INSTITUTIONS.map(category => {
                                const categoryTools = filteredTools.filter(t => t.category === category.id);
                                if (categoryTools.length === 0 && searchTerm) return null; // Ocultar si filtramos y no hay matches

                                const isOpen = openCategories[category.id] || searchTerm; // Expandir todo si busca

                                return (
                                    <div key={category.id} className="animate-fade-in-up">
                                        <button 
                                            onClick={() => toggleCategory(category.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                                padding: '0.75rem 0.5rem',
                                                marginBottom: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '2rem',
                                                height: '2rem',
                                                borderRadius: '0.5rem',
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                color: 'var(--mobile-primary)',
                                                marginRight: '0.75rem'
                                            }}>
                                                <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>{category.icon}</span>
                                            </div>
                                            <span style={{
                                                flex: 1,
                                                textAlign: 'left',
                                                fontWeight: 700,
                                                fontSize: '0.95rem',
                                                color: 'var(--mobile-text)',
                                                letterSpacing: '0.02em'
                                            }}>
                                                {category.label}
                                            </span>
                                            <span 
                                                className="material-icons-round"
                                                style={{
                                                    color: 'var(--mobile-text-muted)',
                                                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s ease'
                                                }}
                                            >
                                                expand_more
                                            </span>
                                        </button>

                                        {isOpen && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingLeft: '0.5rem' }}>
                                                {categoryTools.map(tool => (
                                                    <button 
                                                        key={tool.id}
                                                        className="tool-card-refined"
                                                        onClick={() => handleAccessClick(tool)}
                                                    >
                                                        <div className="icon-box-small">
                                                            <span className="material-icons-round">{tool.icon}</span>
                                                        </div>
                                                        <div style={{ 
                                                            textAlign: 'left', 
                                                            flex: 1,
                                                            minWidth: 0
                                                        }}>
                                                            <div style={{
                                                                fontWeight: 700,
                                                                color: 'var(--mobile-text)',
                                                                fontSize: '0.9rem',
                                                                lineHeight: 1.4,
                                                                marginBottom: '0.25rem'
                                                            }}>
                                                                {tool.title}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '0.75rem',
                                                                color: 'var(--mobile-text-muted)',
                                                                fontWeight: 500
                                                            }}>
                                                                {tool.subtitle}
                                                            </div>
                                                        </div>
                                                        <span 
                                                            className="material-icons-round" 
                                                            style={{
                                                                color: 'var(--mobile-text-muted)',
                                                                fontSize: '1.25rem',
                                                                marginLeft: '0.5rem',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            chevron_right
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* BÚSQUEDA */}
                {searchTerm && (
                    <div className="animate-fade-in">
                        <div className="section-label" style={{ marginBottom: '0.875rem', paddingLeft: '0.25rem' }}>
                            RESULTADOS DE BÚSQUEDA
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {filteredTools.map(tool => (
                                <button 
                                    key={tool.id}
                                    className="tool-card-refined"
                                    onClick={() => handleAccessClick(tool)}
                                >
                                    <div className="icon-box-small">
                                        <span className="material-icons-round">{tool.icon}</span>
                                    </div>
                                    <div style={{ 
                                        textAlign: 'left', 
                                        flex: 1,
                                        minWidth: 0
                                    }}>
                                        <div style={{
                                            fontWeight: 700,
                                            color: 'var(--mobile-text)',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.4,
                                            marginBottom: '0.25rem'
                                        }}>
                                            {tool.title}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--mobile-text-muted)',
                                            fontWeight: 500
                                        }}>
                                            {tool.subtitle}
                                        </div>
                                    </div>
                                    <span 
                                        className="material-icons-round" 
                                        style={{
                                            color: 'var(--mobile-text-muted)',
                                            fontSize: '1.25rem',
                                            marginLeft: '0.5rem',
                                            flexShrink: 0
                                        }}
                                    >
                                        chevron_right
                                    </span>
                                </button>
                            ))}
                            {filteredTools.length === 0 && (
                                <div className="search-empty-state">
                                    <span className="material-icons-round">search_off</span>
                                    <span>No hay resultados</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileAccess;
