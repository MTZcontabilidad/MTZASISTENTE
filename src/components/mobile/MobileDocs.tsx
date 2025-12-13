import React, { useState, useEffect } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

// Mock Data removed
// const DOCUMENTS = ...


const CATEGORIES = ['Todos', 'IVA', 'Liquidaciones', 'Imposiciones', 'Otros'];

const MobileDocs: React.FC = () => {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
                
                // Transform data to match UI expected format
                const formattedDocs = (data || []).map(d => ({
                    id: d.id,
                    title: d.document_name,
                    type: d.document_type || 'Otros',
                    date: new Date(d.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
                    status: 'Disponible', // Default status as we filter by active
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
            // Simulate download progress or handle actual download if it's a direct link
            // For now, assuming a direct link we can open or hidden iframe
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

    const handleView = (doc: any) => {
        setViewDoc(doc);
    };

    const closeViewer = () => {
        setViewDoc(null);
    };

    // Filter Logic
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
        <div className="mobile-view-container relative h-full flex flex-col bg-slate-900">
            {toastMessage && (
                <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }} className="status-badge success animate-fade-in shadow-lg">
                    {toastMessage}
                </div>
            )}

            <div className="glass-header">
                <div>
                     <h1 className="text-lg font-bold text-gradient">Mis Documentos</h1>
                     <p className="text-xs text-gray-400">Archivos disponibles</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-900/20 flex items-center justify-center border border-green-500/30">
                     <span className="material-icons-round text-green-400">folder</span>
                </div>
            </div>

            <div className="mobile-scroll-content pb-24 px-4 pt-4">
                {/* Search & Filter */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md py-2 mb-4">
                    <div className="mobile-input-group search-bar-modern mb-3">
                        <span className="mobile-input-icon material-icons-round">search</span>
                        <input 
                            className="mobile-input" 
                            style={{ background: 'transparent', border: 'none' }}
                            placeholder="Buscar documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                         {CATEGORIES.map(cat => (
                             <button 
                                key={cat}
                                className={`tag-btn whitespace-nowrap ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                             >
                                {cat}
                             </button>
                         ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10"><div className="loader"></div></div>
                ) : (
                    <div className="flex flex-col gap-3">
                         {/* Stats Section only on 'Todos' */}
                         {activeCategory === 'Todos' && !searchTerm && docs.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-in">
                                <div className="premium-card p-3 rounded-xl bg-blue-900/10 border-blue-500/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                            <span className="material-icons-round text-xl">receipt_long</span>
                                        </div>
                                        <span className="text-xs font-bold text-blue-300">{getCountByCategory('IVA')}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">Declaraciones IVA</div>
                                </div>
                                <div className="premium-card p-3 rounded-xl bg-green-900/10 border-green-500/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                                            <span className="material-icons-round text-xl">payments</span>
                                        </div>
                                        <span className="text-xs font-bold text-green-300">{getCountByCategory('Liquidaciones')}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">Liquidaciones</div>
                                </div>
                            </div>
                         )}

                        {filteredDocs.length > 0 ? (
                            filteredDocs.map((doc, idx) => (
                                <div 
                                    key={doc.id} 
                                    className="premium-card p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all animate-slide-up"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    <div className="flex items-center gap-4 overflow-hidden flex-1">
                                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                                             doc.type.includes('IVA') ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' :
                                             doc.type.includes('Liquidacion') ? 'bg-green-900/20 border-green-500/30 text-green-400' :
                                             'bg-gray-800 border-gray-700 text-gray-400'
                                         }`}>
                                             <span className="material-icons-round text-2xl">{doc.icon}</span>
                                         </div>
                                         <div className="min-w-0 flex-1">
                                             <div className="font-semibold text-white truncate text-sm">{doc.title}</div>
                                             <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                                 <span className="flex items-center gap-1">
                                                    <span className="material-icons-round text-[10px]">calendar_today</span>
                                                    {doc.date}
                                                 </span>
                                                 <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                                     doc.type.includes('IVA') ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                                     'border-gray-600 text-gray-400 bg-gray-800'
                                                 }`}>
                                                     {doc.type}
                                                 </span>
                                             </div>
                                         </div>
                                    </div>

                                    <a 
                                        href={doc.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-slate-700 ml-2"
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
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-fade-in">
                                <span className="material-icons-round text-6xl mb-4 opacity-20">folder_off</span>
                                <p>No se encontraron documentos</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileDocs;
