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

    // const showHighlights = !searchTerm; // Unused

    return (
        <div className="mobile-view-container system-bg-void">
            {toastMessage && (
                <div className="toast-notification success">
                    <span className="material-icons-round text-sm">rocket_launch</span>
                    {toastMessage}
                </div>
            )}

            {/* HEADER COMPACTO CON BUSCADOR INTEGRADO */}
            <div className="glass-header" style={{ 
                padding: '1.25rem 1.25rem 1.5rem 1.25rem', 
                height: 'auto', 
                display: 'block',
                background: 'linear-gradient(to bottom, rgba(var(--mobile-bg-rgb), 0.95), rgba(var(--mobile-bg-rgb), 0.8))'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '1.25rem' }}>
                    <div>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            background: 'linear-gradient(to right, #22d3ee, #3b82f6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em',
                            margin: 0,
                            lineHeight: 1
                        }}>
                            Accesos
                        </h1>
                        <p style={{
                            fontSize: '0.7rem',
                            color: 'var(--mobile-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            marginTop: '0.35rem',
                            fontWeight: 600
                        }}>
                            Herramientas & Trámites
                        </p>
                    </div>
                </div>

                <div className="relative group" style={{ position: 'relative' }}>
                    <span 
                        className="material-icons-round" 
                        style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--mobile-primary)',
                            fontSize: '1.25rem',
                            zIndex: 1,
                            pointerEvents: 'none'
                        }}
                    >
                        search
                    </span>
                    <input 
                        className="system-input"
                        placeholder="Buscar servicio..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.875rem 1rem 0.875rem 3rem',
                            borderRadius: '1rem',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            background: 'rgba(15, 23, 42, 0.6)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            color: 'var(--mobile-text)',
                            fontSize: '0.9rem',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    />
                </div>
            </div>

            <div className="mobile-content-scroll" style={{ padding: '1.5rem 1rem 7rem 1rem' }}>
                
{/* INSTITUCIONES / ORGANISMOS - LISTA PRINCIPAL (Solo visible sin búsqueda) */}
                {!searchTerm && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                        {INSTITUTIONS.map(category => {
                            const categoryTools = filteredTools.filter(t => t.category === category.id);
                            // if (categoryTools.length === 0 && searchTerm) return null; // Logic no longer needed as we hide parent

                            const isOpen = openCategories[category.id];

                            return (
                                <div key={category.id} className="animate-fade-in-up" style={{
                                    background: 'rgba(15, 23, 42, 0.4)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    overflow: 'hidden'
                                }}>
                                    <button 
                                        onClick={() => toggleCategory(category.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '100%',
                                            padding: '1rem',
                                            background: isOpen ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                            border: 'none',
                                            borderBottom: isOpen ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '2.25rem',
                                            height: '2.25rem',
                                            borderRadius: '0.75rem',
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                                            color: 'var(--mobile-primary)',
                                            marginRight: '0.875rem',
                                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.15)'
                                        }}>
                                            <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>{category.icon}</span>
                                        </div>
                                        <span style={{
                                            flex: 1,
                                            textAlign: 'left',
                                            fontWeight: 700,
                                            fontSize: '0.95rem',
                                            color: isOpen ? 'var(--mobile-primary)' : 'var(--mobile-text)',
                                            letterSpacing: '0.02em'
                                        }}>
                                            {category.label}
                                        </span>
                                        <span 
                                            className="material-icons-round"
                                            style={{
                                                color: isOpen ? 'var(--mobile-primary)' : 'var(--mobile-text-muted)',
                                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s ease'
                                            }}
                                        >
                                            expand_more
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div style={{ display: 'grid', gap: '1px', background: 'rgba(255, 255, 255, 0.05)' }}>
                                            {categoryTools.map(tool => (
                                                <button 
                                                    key={tool.id}
                                                    onClick={() => handleAccessClick(tool)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '1rem 1.25rem',
                                                        background: 'var(--mobile-bg)', // Opaque to hide grid gap
                                                        width: '100%',
                                                        border: 'none',
                                                        textAlign: 'left',
                                                        gap: '1rem'
                                                    }}
                                                    className="hover:bg-slate-800/50 transition-colors"
                                                >
                                                    <div style={{ color: 'var(--mobile-text-muted)', display: 'flex' }}>
                                                        <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>chevron_right</span>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--mobile-text)', marginBottom: '0.1rem' }}>
                                                            {tool.title}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--mobile-text-muted)' }}>
                                                            {tool.subtitle}
                                                        </div>
                                                    </div>
                                                    <span className="material-icons-round" style={{ fontSize: '1.25rem', color: 'var(--mobile-primary)', opacity: 0.5 }}>
                                                        open_in_new
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* RESULTADOS DE BÚSQUEDA (Solo visible con búsqueda) */}
                {searchTerm && (
                    <div className="animate-fade-in">
                        <div className="section-label" style={{ marginBottom: '0.875rem', paddingLeft: '0.25rem' }}>
                            RESULTADOS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                                            marginBottom: '0.2rem'
                                        }}>
                                            {tool.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--mobile-text-muted)' }}>
                                            {tool.subtitle}
                                        </div>
                                    </div>
                                    <span className="material-icons-round" style={{ color: 'var(--mobile-primary)' }}>
                                        arrow_forward
                                    </span>
                                </button>
                            ))}
                            {filteredTools.length === 0 && (
                                <div className="search-empty-state">
                                    <span className="material-icons-round" style={{ fontSize: '3rem', color: 'var(--mobile-text-muted)', marginBottom: '1rem' }}>manage_search</span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--mobile-text-muted)' }}>No encontramos servicios relacionados</span>
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
