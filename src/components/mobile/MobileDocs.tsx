import React, { useState, useEffect } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

const CATEGORIES = ['Todos', 'IVA', 'Liquidaciones', 'Imposiciones', 'Otros'];

const MobileDocs: React.FC = () => {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todos');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('client_documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                const formattedDocs = (data || []).map(d => ({
                    id: d.id,
                    title: d.document_name,
                    type: d.document_type || 'Otros',
                    date: new Date(d.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
                    status: 'Disponible',
                    url: d.download_url || d.file_url,
                    color: getDocColor(d.document_type),
                    icon: getDocIcon(d.document_type)
                }));
                
                setDocs(formattedDocs);
            } catch (err) {
                console.error('Error fetching documents:', err);
                showToast('Error cargando documentos');
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, []);

    const getDocColor = (type?: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('iva') || t.includes('impuesto')) return 'blue';
        if (t.includes('liquidacion') || t.includes('pago')) return 'green';
        if (t.includes('laboral') || t.includes('contrato')) return 'purple';
        return 'orange';
    };

    const getDocIcon = (type?: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('iva') || t.includes('impuesto')) return 'receipt_long';
        if (t.includes('liquidacion') || t.includes('pago')) return 'payments';
        if (t.includes('laboral') || t.includes('contrato')) return 'badge';
        return 'description';
    };

    const handleDownload = async (doc: any) => {
        if (!doc.url) {
            showToast('URL de descarga no disponible');
            return;
        }

        setDownloadingDoc(doc.title);
        setDownloadProgress(20);
        
        try {
            setTimeout(() => {
                setDownloadProgress(100);
                setTimeout(() => {
                    window.open(doc.url, '_blank');
                    setDownloadingDoc(null);
                    showToast(`Descarga iniciada: ${doc.title}`);
                }, 500);
            }, 1000);
        } catch (e) {
            setDownloadingDoc(null);
            showToast('Error en la descarga');
        }
    };

    const filteredDocs = docs.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              doc.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Todos' || doc.type === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const getCountByCategory = (cat: string) => {
        return docs.filter(d => d.type === cat).length;
    };

    return (
        <div id="mobile-app-root">
            <div className="mobile-view-container">
                {toastMessage && (
                    <div className="status-badge success animate-fade-in floating-toast">
                        {toastMessage}
                    </div>
                )}

                <header className="glass-header">
                    <div>
                        <h1 className="header-title">Mis Documentos</h1>
                        <p className="header-subtitle">Archivos disponibles</p>
                    </div>
                    <div className="header-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                        <span className="material-icons-round" style={{ color: '#22c55e' }}>folder</span>
                    </div>
                </header>

                <div className="mobile-content-scroll docs-content">
                    {/* Search & Filter */}
                    <div className="search-section">
                        <div className="glass-input-wrapper mb-2">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-icons-round" style={{ color: 'var(--mobile-text-secondary)', fontSize: '1.25rem' }}>search</span>
                                <input 
                                    className="mobile-input" 
                                    placeholder="Buscar documento..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="category-tags">
                            {CATEGORIES.map(cat => (
                                <button 
                                    key={cat}
                                    className={`tag-btn ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="loader-container"><div className="loader"></div></div>
                    ) : (
                        <div>
                            {/* Stats Section */}
                            {activeCategory === 'Todos' && !searchTerm && docs.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }} className="animate-fade-in">
                                    <div className="premium-card" style={{ padding: '0.75rem', borderColor: 'rgba(96, 165, 250, 0.2)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div className="item-icon-box" style={{ width: '2rem', height: '2rem', color: '#60a5fa' }}>
                                                <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>receipt_long</span>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>{getCountByCategory('IVA')}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--mobile-text-secondary)' }}>Declaraciones IVA</div>
                                    </div>
                                    <div className="premium-card" style={{ padding: '0.75rem', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div className="item-icon-box green" style={{ width: '2rem', height: '2rem' }}>
                                                <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>payments</span>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e' }}>{getCountByCategory('Liquidaciones')}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--mobile-text-secondary)' }}>Liquidaciones</div>
                                    </div>
                                </div>
                            )}

                            {filteredDocs.length > 0 ? (
                                <div className="docs-list">
                                    {filteredDocs.map((doc, idx) => (
                                        <div 
                                            key={doc.id} 
                                            className="premium-card doc-card slide-up"
                                            style={{ animationDelay: `${idx * 0.05}s` }}
                                        >
                                            <div className="doc-icon">
                                                <span className="material-icons-round">{doc.icon}</span>
                                            </div>
                                            <div className="doc-info">
                                                <h3 className="doc-title">{doc.title}</h3>
                                                <div className="doc-meta">
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <span className="material-icons-round icon-tiny">calendar_today</span>
                                                        {doc.date}
                                                    </span>
                                                    <span className="status-badge neutral" style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                                                        {doc.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <a 
                                                href={doc.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="icon-btn-secondary"
                                                onClick={(e) => {
                                                    if (!doc.url) {
                                                        e.preventDefault();
                                                        showToast('URL no disponible');
                                                    } else {
                                                        handleDownload(doc);
                                                    }
                                                }}
                                            >
                                                <span className="material-icons-round">download</span>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span className="material-icons-round empty-icon">folder_off</span>
                                    <p>No se encontraron documentos</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileDocs;
