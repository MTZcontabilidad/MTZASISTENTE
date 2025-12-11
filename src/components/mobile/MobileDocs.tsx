import React, { useState } from 'react';
import './Mobile.css';

// Mock Data
const DOCUMENTS = [
    { id: 1, title: 'Liquidación Octubre', type: 'Liquidaciones', date: '30 Oct', status: 'Pendiente', color: 'green', icon: 'payments' },
    { id: 2, title: 'Formulario 29 - Sep', type: 'IVA', date: '20 Oct', status: 'Declarado', color: 'blue', icon: 'receipt_long' },
    { id: 3, title: 'Certificado Cotizaciones', type: 'Imposiciones', date: '15 Oct', status: 'Disponible', color: 'purple', icon: 'savings' },
    { id: 4, title: 'Balance 2022', type: 'Otros', date: '01 Oct', status: 'Auditado', color: 'orange', icon: 'analytics' },
    { id: 5, title: 'Liquidación Septiembre', type: 'Liquidaciones', date: '30 Sep', status: 'Pagado', color: 'green', icon: 'payments' },
];

const CATEGORIES = ['Todos', 'IVA', 'Liquidaciones', 'Imposiciones', 'Otros'];

const MobileDocs: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todos');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [viewDoc, setViewDoc] = useState<any>(null);
    const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleDownload = (docTitle: string) => {
        setDownloadingDoc(docTitle);
        setDownloadProgress(0);
        
        const interval = setInterval(() => {
            setDownloadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setDownloadingDoc(null);
                    showToast(`Descarga completada: ${docTitle}`);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    const handleView = (doc: any) => {
        setViewDoc(doc);
    };

    const closeViewer = () => {
        setViewDoc(null);
    };

    // Filter Logic
    const filteredDocs = DOCUMENTS.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              doc.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Todos' || doc.type === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const getCountByCategory = (cat: string) => {
        return DOCUMENTS.filter(d => d.type === cat).length;
    };

    return (
        <div className="mobile-view-container relative">
            {toastMessage && (
                <div style={{
                    position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(16, 185, 129, 0.9)', color: 'white', padding: '0.75rem 1.5rem',
                    borderRadius: '2rem', zIndex: 100, fontSize: '0.875rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    whiteSpace: 'nowrap', backdropFilter: 'blur(4px)'
                }}>
                    {toastMessage}
                </div>
            )}

            {/* Document Viewer Modal */ }
            {viewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
                    <div className="premium-card w-full h-full max-h-[85vh] flex flex-col rounded-2xl animate-scale-in" style={{ border: '1px solid rgba(0, 212, 255, 0.2)', backgroundColor: '#111827' }}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                    <span className="material-icons-round">picture_as_pdf</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">{viewDoc.title}</h3>
                                    <p className="text-gray-400 text-xs">{viewDoc.date} • 2.4 MB</p>
                                </div>
                            </div>
                            <button onClick={closeViewer} className="p-2 text-gray-400 hover:text-white">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                                <span className="material-icons-round text-6xl mb-2">description</span>
                                <p>Vista previa no disponible</p>
                            </div>
                            <div className="w-3/4 h-3/4 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center p-8 text-center">
                                <p className="text-gray-400 text-sm">Contenido simulado del documento PDF para <strong>{viewDoc.title}</strong>.</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-800 flex gap-3">
                            <button className="mobile-btn-ghost flex-1 justify-center" onClick={closeViewer}>Cerrar</button>
                            <button className="mobile-btn-primary flex-1 justify-center" onClick={() => { closeViewer(); handleDownload(viewDoc.title); }}>
                                <span className="material-icons-round mr-2 text-sm">download</span>
                                Descargar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Downloading Overlay */ }
            {downloadingDoc && (
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="premium-card p-6 rounded-2xl flex flex-col items-center gap-4 w-64">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                             <svg className="animate-spin w-full h-full text-blue-500/20" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             <span className="absolute text-xs font-bold text-blue-400">{downloadProgress}%</span>
                        </div>
                        <p className="text-white text-sm font-medium text-center">Descargando<br/>{downloadingDoc}...</p>
                    </div>
                </div>
            )}

            {/* Header removed */}
            <div className="mobile-scroll-content" style={{ paddingTop: '1.5rem' }}>
                {/* Search Bar */}
                <div className="docs-sticky-header animate-slide-in">
                    <div className="mobile-input-group" style={{ marginBottom: '0.5rem' }}>
                        <span className="mobile-input-icon material-icons-round">search</span>
                        <input 
                            className="mobile-input glass-input-wrapper" 
                            placeholder="Buscar por nombre, RUT o fecha..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', padding: '0.375rem', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                             <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>filter_list</span>
                        </button>
                    </div>
                    
                    {/* Tags */}
                    <div className="tag-scroll-container">
                         {CATEGORIES.map(cat => (
                             <button 
                                key={cat}
                                className={`tag-btn ${activeCategory === cat ? 'active' : ''}`}
                                style={activeCategory === cat ? { boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)' } : {}}
                                onClick={() => setActiveCategory(cat)}
                             >
                                {cat}
                             </button>
                         ))}
                    </div>
                </div>

                {/* Categories Summary (Only show on 'Todos') */}
                {activeCategory === 'Todos' && !searchTerm && (
                    <div className="animate-slide-in" style={{ animationDelay: '0.1s', marginBottom: '1.5rem', marginTop: '1rem' }}>
                        <h2 className="section-title">Categorías Principales</h2>
                        <div className="grid-2">
                             {/* Dynamic Summary Cards */}
                            <button 
                                className="mobile-card premium-card" 
                                onClick={() => setActiveCategory('IVA')}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.75rem' }}>
                                    <div style={{ padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: '#60a5fa', display: 'flex', boxShadow: '0 0 8px rgba(96, 165, 250, 0.2)' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>receipt_long</span>
                                    </div>
                                    <span className="doc-stats-badge">{getCountByCategory('IVA')} Docs</span>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>IVA (F29)</p>
                                    <p style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: '0.125rem', textAlign: 'left' }}>Declaraciones mensuales</p>
                                </div>
                            </button>

                            <button 
                                className="mobile-card premium-card" 
                                onClick={() => setActiveCategory('Liquidaciones')}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.75rem' }}>
                                    <div style={{ padding: '0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem', color: '#4ade80', display: 'flex', boxShadow: '0 0 8px rgba(74, 222, 128, 0.2)' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>payments</span>
                                    </div>
                                    <span className="doc-stats-badge">{getCountByCategory('Liquidaciones')} Docs</span>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>Liquidaciones</p>
                                    <p style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: '0.125rem', textAlign: 'left' }}>Sueldos y finiquitos</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Recent Docs List */}
                 <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h2 className="section-title" style={{ marginBottom: 0 }}>
                            {activeCategory === 'Todos' ? 'Documentos Recientes' : `Documentos: ${activeCategory}`}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Filtrar por:</span>
                            <span style={{ fontSize: '0.625rem', color: 'var(--neon-blue)', fontWeight: 500 }}>Fecha</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {filteredDocs.length > 0 ? filteredDocs.map(doc => (
                             <div key={doc.id} className="mobile-card" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', marginBottom: 0 }}>
                                 <div style={{ 
                                     height: '2.5rem', width: '2.5rem', borderRadius: '0.5rem', 
                                     backgroundColor: `rgba(${doc.color === 'green' ? '34, 197, 94' : doc.color === 'blue' ? '59, 130, 246' : doc.color === 'purple' ? '168, 85, 247' : '249, 115, 22'}, 0.1)`, 
                                     display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                     color: doc.color === 'green' ? '#4ade80' : doc.color === 'blue' ? '#60a5fa' : doc.color === 'purple' ? '#c084fc' : '#fb923c', 
                                     flexShrink: 0, marginRight: '0.75rem', position: 'relative' 
                                }}>
                                    <span className="material-icons-round" style={{ fontSize: '1.5rem' }}>{doc.icon}</span>
                                    {doc.status === 'Pendiente' && <div style={{ position: 'absolute', top: '-0.25rem', right: '-0.25rem', width: '0.625rem', height: '0.625rem', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #111118' }}></div>}
                                 </div>
                                 <div style={{ flex: 1, minWidth: 0 }}>
                                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                         <h3 style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f3f4f6' }}>{doc.title}</h3>
                                         <span style={{ 
                                             fontSize: '0.625rem', 
                                             color: doc.status === 'Pendiente' ? '#f87171' : '#4ade80', 
                                             backgroundColor: doc.status === 'Pendiente' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(74, 222, 128, 0.1)', 
                                             border: `1px solid ${doc.status === 'Pendiente' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(74, 222, 128, 0.2)'}`, 
                                             padding: '0.125rem 0.375rem', borderRadius: '0.25rem', marginLeft: '0.5rem', whiteSpace: 'nowrap' 
                                         }}>
                                             {doc.status}
                                         </span>
                                     </div>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                                         <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>{doc.type} • {doc.date}</span>
                                     </div>
                                 </div>
                                 <div style={{ display: 'flex' }}>
                                    <button 
                                        onClick={() => handleView(doc)}
                                        style={{ padding: '0.5rem', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>visibility</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDownload(doc.title)}
                                        style={{ padding: '0.5rem', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                    >
                                        <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>download</span>
                                    </button>
                                 </div>
                             </div>
                        )) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                No se encontraron documentos.
                            </div>
                        )}
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default MobileDocs;
