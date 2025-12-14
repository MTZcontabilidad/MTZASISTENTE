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
                    <h1 className="text-lg font-bold text-white">Documentos</h1>
                    <p className="text-xs text-slate-400">Archivos y Carpetas</p>
                </header>

                <div className="mobile-content-scroll">
                    <div className="search-section mb-6">
                        <div className="input-icon-wrapper mb-3">
                            <span className="material-icons-round">search</span>
                            <input 
                                className="system-input" 
                                placeholder="Buscar archivo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button 
                                    key={cat}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-all border ${activeCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-400 border-slate-700'}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                         <div className="flex justify-center py-10 text-white">Cargando...</div>
                    ) : (
                        <div className="system-list-container">
                            {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                                <div 
                                    key={doc.id} 
                                    className="system-list-item w-full justify-between"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="icon-box-tool">
                                            <span className="material-icons-round">{doc.icon}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="item-title truncate">{doc.title}</h3>
                                            <div className="item-subtitle flex items-center gap-2">
                                                <span>{doc.date}</span>
                                                <span className="status-badge neutral py-0 text-[0.6rem]">{doc.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDownload(doc)}
                                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full"
                                    >
                                        <span className="material-icons-round">download</span>
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-slate-500">
                                    <span className="material-icons-round text-4xl mb-2">folder_off</span>
                                    <p className="text-xs uppercase">No se encontraron archivos</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
    );
};

export default MobileDocs;
