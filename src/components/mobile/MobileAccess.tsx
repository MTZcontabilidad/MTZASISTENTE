import React, { useState, useEffect } from 'react';
import './Mobile.css';

const ADMINISTRATIVE_TOOLS = [
    { id: 'facturacion', title: 'Facturación SII', subtitle: 'Emisión y consultas', icon: 'receipt_long', url: 'https://homer.sii.cl/', category: 'Tributario' },
    { id: 'carpeta', title: 'Carpeta Tributaria', subtitle: 'Documentación oficial', icon: 'folder_shared', url: 'https://zeus.sii.cl/autor/carpeta_tributaria/index.html', category: 'Tributario' },
    { id: 'marcas', title: 'Registro de Marcas', subtitle: 'Propiedad intelectual', icon: 'copyright', url: 'https://www.inapi.cl/', category: 'Legal' },
    { id: 'diario', title: 'Diario Oficial', subtitle: 'Publicaciones legales', icon: 'article', url: 'https://www.diariooficial.cl/', category: 'Legal' },
    { id: 'rrhh', title: 'Dirección del Trabajo', subtitle: 'Trámites laborales', icon: 'work', url: 'https://www.dt.gob.cl/portal/1626/w3-channel.html', category: 'Laboral' },
    { id: 'previred', title: 'Previred', subtitle: 'Pago cotizaciones', icon: 'savings', url: 'https://www.previred.com/', category: 'Laboral' },
    { id: 'cmf', title: 'CMF Chile', subtitle: 'Mercado financiero', icon: 'account_balance', url: 'https://www.cmfchile.cl/', category: 'Otros' },
    { id: 'tesoreria', title: 'Tesorería', subtitle: 'Pagos y certificados', icon: 'account_balance_wallet', url: 'https://www.tgr.cl/', category: 'Tributario' },
];

const HIGHLIGHTS = [
    { id: 'impuestos', title: 'Impuestos Internos', subtitle: 'Portal SII', icon: 'account_balance', url: 'https://homer.sii.cl/', color: 'text-blue-400' },
    { id: 'previred_h', title: 'Previred', subtitle: 'Cotizaciones', icon: 'savings', url: 'https://www.previred.com/', color: 'text-orange-400' },
];

const CATEGORIES = [
    { id: 'Tributario', label: 'Tributario & Pagos', icon: 'attach_money' },
    { id: 'Laboral', label: 'Laboral & RRHH', icon: 'groups' },
    { id: 'Legal', label: 'Legal & Marcas', icon: 'gavel' },
    { id: 'Otros', label: 'Otras Herramientas', icon: 'apps' },
];

const MobileAccess: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [recentTools, setRecentTools] = useState<any[]>([]);
    
    // Accordion State: "Tributario" open by default
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        'Tributario': true, 
        'Laboral': false,
        'Legal': false,
        'Otros': false
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
            <div className="glass-header-integrated sticky top-0 px-6 pt-8 pb-6 flex flex-col gap-5 shadow-2xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none">
                            MTZ <span className="text-blue-500">LINK</span>
                        </h1>
                        <p className="text-[0.6rem] text-slate-400 uppercase tracking-widest mt-0.5 font-medium opacity-80">Portal de Acceso</p>
                    </div>
                    {/* User Avatar Placeholder or Settings could go here */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 opacity-20"></div>
                </div>

                <div className="relative group">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors">search</span>
                    <input 
                        className="w-full bg-[#0f172a]/60 backdrop-blur-md border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner" 
                        placeholder="Buscar herramienta..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="mobile-content-scroll !pt-6 px-4 pb-24">
                {showHighlights && (
                    <div className="mb-8 animate-fade-in space-y-6">
                        {/* HIGHLIGHTS - COMPACT HERO */}
                        <div>
                            <div className="flex justify-between items-end mb-3 px-1">
                                <h2 className="section-label !mb-0 text-xs font-bold tracking-wider text-slate-500">ACCESOS DIRECTOS</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {HIGHLIGHTS.map((highlight) => (
                                    <button 
                                        key={highlight.id}
                                        className="highlight-card-compact group" 
                                        onClick={() => handleAccessClick(highlight)}
                                    >
                                        <div className={`icon-container ${highlight.color ? highlight.color.replace('text-', 'bg-').replace('400', '500/20') : 'bg-slate-700/50'} text-xl`}>
                                            <span className={`material-icons-round ${highlight.color || 'text-white'}`}>{highlight.icon}</span>
                                        </div>
                                        
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="font-bold text-white text-xs leading-tight mb-0.5 truncate">{highlight.title}</div>
                                            <div className="text-[0.6rem] text-slate-400 font-medium truncate opacity-80">{highlight.subtitle}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RECENT TOOLS */}
                        {recentTools.length > 0 && (
                            <div>
                                <h2 className="section-label mb-3 px-1 text-xs font-bold tracking-wider text-slate-500">RECIENTES</h2>
                                <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
                                    {recentTools.map((tool) => (
                                        <button 
                                            key={tool.id}
                                            className="flex flex-col items-center gap-2 min-w-[4rem] group"
                                            onClick={() => handleAccessClick(tool)}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-[#1e293b] border border-slate-700/60 flex items-center justify-center group-hover:border-blue-500/50 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all">
                                                <span className="material-icons-round text-slate-400 group-hover:text-blue-400 transition-colors text-xl">{tool.icon || 'history'}</span>
                                            </div>
                                            <div className="text-[0.6rem] text-slate-500 text-center max-w-[4.5rem] truncate font-medium group-hover:text-slate-300 transition-colors">{tool.title}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="animate-fade-in">
                    {/* If searching, keep simple grid. If not, stick to Accordions */}
                    {searchTerm ? (
                        <>
                             <div className="section-label mb-3 px-1">RESULTADOS DE BÚSQUEDA</div>
                             <div className="grid grid-cols-2 gap-3">
                                {filteredTools.map(tool => (
                                    <button 
                                        key={tool.id}
                                        className="tool-card-refined group"
                                        onClick={() => handleAccessClick(tool)}
                                    >
                                        <div className="flex justify-between items-start w-full mb-1">
                                            <div className="p-2 rounded-lg bg-slate-800/50 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                                <span className="material-icons-round text-xl">{tool.icon}</span>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-slate-200 text-xs mb-0.5">{tool.title}</div>
                                            <div className="text-[0.65rem] text-slate-500">{tool.subtitle}</div>
                                        </div>
                                    </button>
                                ))}
                                {filteredTools.length === 0 && <div className="col-span-2 text-center text-slate-500 py-12 flex flex-col items-center opacity-60">
                                    <span className="material-icons-round text-4xl mb-2">search_off</span>
                                    <span>No hay resultados</span>
                                </div>}
                             </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            {CATEGORIES.map(category => {
                                const toolsInCategory = filteredTools.filter(t => t.category === category.id);
                                if (toolsInCategory.length === 0) return null;

                                const isOpen = openCategories[category.id];

                                return (
                                    <div key={category.id} className={`accordion-item ${isOpen ? 'open' : ''}`}>
                                        <button 
                                            className="accordion-trigger"
                                            onClick={() => toggleCategory(category.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                                                     <span className="material-icons-round text-blue-400 text-lg">{category.icon}</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-100 tracking-wide">{category.label}</span>
                                            </div>
                                            <span className={`material-icons-round text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                        </button>
                                        
                                        {isOpen && (
                                            <div className="accordion-content pb-4 px-3">
                                                <div className="grid grid-cols-1 gap-2"> {/* Changed to 1 column for list-like view, or keep 2 if preferred. 1 col works better for "depth" cards usually? Let's stick to 1 for "Refined" list look, or 2 for Grid. User liked Grid in Highlights. Let's try 1 column for Tools to make them readable "rows" */}
                                                    {toolsInCategory.map(tool => (
                                                        <button 
                                                            key={tool.id}
                                                            className="tool-card-refined group"
                                                            onClick={() => handleAccessClick(tool)}
                                                        >
                                                            <div className="icon-box-small">
                                                                <span className="material-icons-round text-lg">{tool.icon}</span>
                                                            </div>
                                                            <div className="text-left flex-1">
                                                                <div className="font-bold text-slate-200 text-sm leading-tight">{tool.title}</div>
                                                                <div className="text-[0.65rem] text-slate-400 font-medium">{tool.subtitle}</div>
                                                            </div>
                                                            <span className="material-icons-round text-slate-600 text-lg opacity-0 group-hover:opacity-100 transition-opacity -mr-1">chevron_right</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileAccess;
