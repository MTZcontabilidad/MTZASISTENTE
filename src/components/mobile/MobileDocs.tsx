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
        showToast(`Descargando: ${doc.title}`);
        setTimeout(() => {
            window.open(doc.url, '_blank');
        }, 500);
    };

    const filteredDocs = docs.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              doc.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Todos' || doc.type === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
            <div className="mobile-view-container system-bg-void">
                {toastMessage && (
                     <div className="toast-notification success">
                        {toastMessage}
                    </div>
                )}

                <header className="glass-header">
                    <h1>Documentos</h1>
                    <p>Archivos y Carpetas</p>
                </header>

                <div className="mobile-content-scroll" style={{ padding: '1.5rem 1rem 6rem 1rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="input-icon-wrapper" style={{ marginBottom: '1rem' }}>
                            <span className="material-icons-round">search</span>
                            <input 
                                className="system-input" 
                                placeholder="Buscar archivo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {CATEGORIES.map(cat => (
                                <button 
                                    key={cat}
                                    className={activeCategory === cat ? 'category-filter active' : 'category-filter'}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                         <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                             <div className="loading-spinner"></div>
                         </div>
                    ) : (
                        <div className="system-list-container">
                            {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                                <div 
                                    key={doc.id} 
                                    className="system-list-item"
                                    style={{ justifyContent: 'space-between' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                                        <div className="icon-box-tool">
                                            <span className="material-icons-round">{doc.icon}</span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 className="item-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</h3>
                                            <div className="item-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                <span>{doc.date}</span>
                                                <span className="status-badge neutral" style={{ padding: '0.125rem 0.375rem', fontSize: '0.65rem' }}>{doc.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDownload(doc)}
                                        className="icon-btn-secondary"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <span className="material-icons-round">download</span>
                                    </button>
                                </div>
                            )) : (
                                <div className="empty-state-mobile">
                                    <div className="empty-icon">
                                        <span className="material-icons-round">folder_off</span>
                                    </div>
                                    <p className="empty-subtitle" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>No se encontraron archivos</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
    );
};

export default MobileDocs;
