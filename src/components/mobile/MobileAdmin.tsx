import React, { useState, useEffect } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

const UsersView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ fullName: '', role: '', isActive: false });
    const [userFilter, setUserFilter] = useState<'pending' | 'clients' | 'all'>('pending'); // Nueva gestión de tabs

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUserClick = (user: any) => {
        setSelectedUser(user);
        setEditForm({
            fullName: user.full_name || '',
            role: user.role || 'invitado',
            isActive: user.is_active || false
        });
    };

    const handleSaveUser = async () => {
        if (!selectedUser) return;
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ 
                    full_name: editForm.fullName,
                    role: editForm.role,
                    is_active: editForm.isActive
                })
                .eq('id', selectedUser.id);
            
            if (error) throw error;
            showToast('Usuario actualizado correctamente');
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('Error al actualizar usuario');
        }
    };

    // Función rápida para asignar como cliente
    const handleAssignAsClient = async () => {
        if (!selectedUser) return;
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ 
                    role: 'cliente',
                    is_active: true
                })
                .eq('id', selectedUser.id);
            
            if (error) throw error;
            showToast('¡Usuario asignado como Cliente!');
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            showToast('Error al asignar cliente');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                              (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        if (userFilter === 'pending') return user.role === 'invitado' || !user.role;
        if (userFilter === 'clients') return user.role === 'cliente';
        return true; // 'all'
    });

    return (
        <div className="flex flex-col h-full animate-slide-in">
            {toastMessage && (
                <div className="toast-notification success">
                    {toastMessage}
                </div>
            )}

            <div className="glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onBack} className="icon-btn-secondary" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--mobile-text)' }}>Gestión de Usuarios</h2>
                <div style={{ width: '2.5rem' }} />
            </div>

            {/* Tabs de Filtro */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                 <button 
                    className={`category-filter ${userFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setUserFilter('pending')}
                    style={{ fontSize: '0.85rem', flex: 1 }}
                >
                    Nuevos / Gmail 
                    {users.filter(u => u.role === 'invitado' || !u.role).length > 0 && 
                        <span className="info-badge" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                            {users.filter(u => u.role === 'invitado' || !u.role).length}
                        </span>
                    }
                </button>
                 <button 
                    className={`category-filter ${userFilter === 'clients' ? 'active' : ''}`}
                    onClick={() => setUserFilter('clients')}
                    style={{ fontSize: '0.85rem', flex: 1 }}
                >
                    Clientes
                </button>
                <button 
                    className={`category-filter ${userFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setUserFilter('all')}
                    style={{ fontSize: '0.85rem', width: 'auto' }}
                >
                    Todos
                </button>
            </div>

            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                <div className="input-icon-wrapper" style={{ marginBottom: '1rem' }}>
                    <span className="material-icons-round">search</span>
                    <input 
                        className="system-input" 
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <div className="system-list-container">
                        {filteredUsers.map(user => (
                            <button 
                                key={user.id} 
                                className="system-list-item"
                                style={{ width: '100%' }}
                                onClick={() => handleUserClick(user)}
                            >
                                <div className="avatar-wrapper" style={{ 
                                    width: '2.5rem', 
                                    height: '2.5rem',
                                    border: '2px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                    ) : (
                                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>person</span>
                                    )}
                                </div>
                                <div className="item-info" style={{ textAlign: 'left' }}>
                                    <div className="item-title">{user.full_name || user.email || 'Usuario Google'}</div>
                                    <div className="item-email" style={{ fontSize: '0.75rem', color: 'var(--mobile-text-muted)' }}>{user.email}</div>
                                    <div className="item-subtitle" style={{ textTransform: 'uppercase', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                                        <span className={`status-badge ${user.role === 'cliente' ? 'success' : user.role === 'admin' ? 'warning' : 'neutral'}`} style={{ padding: '0.1rem 0.4rem' }}>
                                            {user.role || 'Invitado'}
                                        </span>
                                    </div>
                                </div>
                                <span className="material-icons-round" style={{ color: 'var(--mobile-text-muted)', fontSize: '1.25rem' }}>edit</span>
                            </button>
                        ))}
                         {filteredUsers.length === 0 && (
                            <div className="empty-state-mobile">
                                <p className="empty-subtitle">No se encontraron usuarios</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {selectedUser && (
                <div className="modal-overlay bottom-sheet" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1rem' }}>Administrar Usuario</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--mobile-text-muted)', marginBottom: '1.5rem' }}>
                            {selectedUser.email}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Quick Action for Pending Users */}
                            {(editForm.role === 'invitado' || !editForm.role) && (
                                <button 
                                    onClick={handleAssignAsClient} 
                                    className="btn-primary"
                                    style={{ 
                                        width: '100%', 
                                        marginBottom: '1rem',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        borderColor: 'rgba(16, 185, 129, 0.5)'
                                    }}
                                >
                                    <span className="material-icons-round">how_to_reg</span>
                                    Aprobar como Cliente
                                </button>
                            )}

                            <div>
                                <label className="section-label">Nombre Completo</label>
                                <input 
                                    className="system-input"
                                    value={editForm.fullName}
                                    onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="section-label">Rol del Sistema</label>
                                <select 
                                    className="system-input"
                                    value={editForm.role}
                                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                                >
                                    <option value="invitado">Invitado (Por defecto)</option>
                                    <option value="cliente">Cliente Confirmado</option>
                                    <option value="admin">Administrador Total</option>
                                </select>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                padding: '1rem',
                                background: 'rgba(var(--mobile-card-rgb), 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.75rem'
                            }}>
                                <span style={{ color: 'var(--mobile-text)', fontWeight: 600 }}>Acceso Activo</span>
                                <div 
                                    className={`toggle-switch ${editForm.isActive ? 'active' : ''}`}
                                    onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})}
                                >
                                    <div className="toggle-knob"></div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button 
                                    onClick={() => setSelectedUser(null)} 
                                    className="btn-ghost"
                                    style={{ flex: 1 }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveUser} 
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RequestsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending'>('pending');

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const [leadsRes] = await Promise.all([
                supabase.from('guest_leads').select('*').order('created_at', { ascending: false }).limit(50)
            ]);

            // Map leads to the request structure with specific categories
            const leads = (leadsRes.data || []).map(r => {
                const intent = (r.intent || '').toLowerCase();
                let type = 'Solicitud General';
                let icon = 'assignment';

                if (intent.includes('inicio') || intent.includes('actividades')) {
                    type = 'Inicio de Actividades';
                    icon = 'business';
                } else if (intent.includes('reunion') || intent.includes('agendar') || intent.includes('meeting')) {
                    type = 'Reunión';
                    icon = 'event';
                } else if (intent.includes('renta') || intent.includes('contable')) {
                    type = 'Solicitud Contable';
                    icon = 'account_balance_wallet';
                }

                return { 
                    ...r, 
                    type, 
                    icon, 
                    sourceTable: 'guest_leads', 
                    name: r.contact_info?.name || 'Invitado',
                    status: r.status || 'pending'
                };
            });

            const combined = [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setRequests(combined);
        } catch (error) {
            console.error("Error fetching requests:", error);
            showToast("Error al cargar solicitudes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, table: string, action: 'approved' | 'rejected') => {
        try {
            // For leads, we might just want to acknowledge them, but if table is guest_leads and no status column exists, this might fail.
            // Assuming we want to support status update if column exists, or show toast.
            showToast(action === 'approved' ? "Procesando..." : "Archivando...");
            const { error } = await supabase.from(table).update({ status: action }).eq('id', id);
            
            if (error) {
                // If column doesn't exist, we might get an error. 
                // In a real scenario we'd check schema. For now, we'll try/catch.
                console.warn("Could not update status, maybe column missing?", error);
                if (table === 'guest_leads') {
                    showToast("Estado actualizado localmente");
                     // Mock update locally to remove from list if pending filter
                     setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
                } else {
                    throw error;
                }
            } else {
                 showToast(`Solicitud ${action === 'approved' ? 'aprobada' : 'rechazada'}`);
                 fetchRequests();
            }
        } catch (error) {
            console.error("Error updating request:", error);
            showToast("Error al procesar solicitud");
        }
    };

    const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === 'pending' || !r.status);

    return (
        <div className="flex flex-col h-full animate-slide-in">
             {toastMessage && <div className="toast-notification success">{toastMessage}</div>}

            <div className="glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onBack} className="icon-btn-secondary" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--mobile-text)' }}>Solicitudes y Leads</h2>
                <div style={{ width: '2.5rem' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                 <button 
                    className={filter === 'pending' ? 'category-filter active' : 'category-filter'}
                    onClick={() => setFilter('pending')}
                    style={{ fontSize: '0.875rem' }}
                >
                    Pendientes
                </button>
                 <button 
                    className={filter === 'all' ? 'category-filter active' : 'category-filter'}
                    onClick={() => setFilter('all')}
                    style={{ fontSize: '0.875rem' }}
                >
                    Historial
                </button>
            </div>

            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <>
                    {filteredRequests.map(req => (
                        <div key={req.id} className="highlight-card" style={{ minHeight: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                    <span className="material-icons-round" style={{ color: 'var(--mobile-primary)', fontSize: '1.5rem' }}>{req.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--mobile-text)', fontSize: '0.95rem' }}>{req.type}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--mobile-text-muted)', marginTop: '0.25rem' }}>
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <span className={`status-badge ${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'warning'}`}>
                                    {req.status === 'pending' || !req.status ? 'Pendiente' : req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--mobile-text)', marginBottom: '0.75rem' }}>
                                Solicitado por: <b>{req.name}</b>
                            </div>
                            
                            {/* Detailed Info for Leads */}
                            {req.sourceTable === 'guest_leads' && req.contact_info && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--mobile-text-muted)', marginBottom: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span className="material-icons-round" style={{ fontSize: '1rem' }}>phone</span>
                                        {req.contact_info.contact}
                                    </div>
                                    {req.contact_info.sii_password && (
                                        <div style={{ color: '#f87171', fontSize: '0.75rem' }}>
                                            Clave SII incluida (Ver en detalle)
                                        </div>
                                    )}
                                </div>
                            )}

                            {(req.status === 'pending' || !req.status) && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => handleAction(req.id, req.sourceTable, 'rejected')} 
                                        className="btn-ghost"
                                        style={{ 
                                            flex: 1,
                                            color: '#f87171',
                                            borderColor: 'rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        {req.sourceTable === 'guest_leads' ? 'Archivar' : 'Rechazar'}
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req.id, req.sourceTable, 'approved')} 
                                        className="btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        {req.sourceTable === 'guest_leads' ? 'Contactado' : 'Aprobar'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredRequests.length === 0 && (
                        <div className="empty-state-mobile">
                            <div className="empty-icon">
                                <span className="material-icons-round">inbox</span>
                            </div>
                            <p className="empty-subtitle">No hay solicitudes nuevas</p>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
    );
};

const LeadsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLead, setExpandedLead] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeads = async () => {
             setLoading(true);
             const { data, error } = await supabase
                .from('guest_leads')
                .select('*')
                .order('updated_at', { ascending: false });
             
             if (!error) setLeads(data || []);
             setLoading(false);
        };
        fetchLeads();
    }, []);

    return (
        <div className="flex flex-col h-full animate-slide-in">
            <div className="glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onBack} className="icon-btn-secondary" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--mobile-text)' }}>Leads & Capturas</h2>
                <div style={{ width: '2.5rem' }} />
            </div>

            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                {loading ? <div className="loading-spinner mx-auto mt-10"></div> : (
                    <div className="space-y-3">
                        {leads.map(lead => (
                            <div key={lead.id} className="highlight-card" onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <span className="material-icons-round">person_search</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{lead.contact_info?.name || 'Anónimo'}</div>
                                            <div className="text-xs text-slate-400">{lead.intent?.replace(/_/g, ' ') || 'Contacto'}</div>
                                        </div>
                                    </div>
                                    <div className="text-[0.65rem] text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                        {new Date(lead.updated_at).toLocaleDateString()}
                                    </div>
                                </div>

                                {expandedLead === lead.id && (
                                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2 animate-slide-in">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="text-slate-400">Contacto:</div>
                                            <div className="text-white text-right font-mono select-all">{lead.contact_info?.contact}</div>
                                            
                                            {lead.contact_info?.rut && (
                                                <>
                                                    <div className="text-slate-400">RUT:</div>
                                                    <div className="text-white text-right font-mono select-all">{lead.contact_info.rut}</div>
                                                </>
                                            )}
                                            
                                            {lead.contact_info?.sii_password && (
                                                <>
                                                    <div className="text-red-400 font-bold">Clave SII:</div>
                                                    <div className="text-red-300 text-right font-mono select-all blur-sm hover:blur-none transition-all cursor-pointer" title="Click para ver">
                                                        {lead.contact_info.sii_password}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="mt-2 p-2 bg-slate-800 rounded text-xs text-slate-300 italic">
                                            "El usuario solicitó ayuda con un trámite."
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CompaniesView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
    const [assignEmail, setAssignEmail] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const fetchCompanies = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('razon_social', { ascending: true });
        if (!error) setCompanies(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchCompanies(); }, []);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const [editDriveUrl, setEditDriveUrl] = useState('');

    useEffect(() => {
        if (selectedCompany) {
            setEditDriveUrl(selectedCompany.drive_folder_url || '');
            setAssignEmail(''); // Reset email input on open
        }
    }, [selectedCompany]);

    const handleSaveDriveUrl = async () => {
        if (!selectedCompany) return;
        try {
            const { error } = await supabase
                .from('companies')
                .update({ drive_folder_url: editDriveUrl })
                .eq('id', selectedCompany.id);

            if (error) throw error;
            showToast("URL Drive actualizada");
            
            // Update local state
            setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, drive_folder_url: editDriveUrl } : c));
            setSelectedCompany((prev: any) => ({ ...prev, drive_folder_url: editDriveUrl }));
        } catch (error) {
            console.error(error);
            showToast("Error al guardar URL");
        }
    };

    const handleAssignUser = async () => {
        if (!assignEmail || !selectedCompany) return;
        try {
            // 1. Find User
            const { data: users } = await supabase.from('user_profiles').select('id').eq('email', assignEmail).single();
            if (!users) {
                showToast("Usuario no encontrado (¿Registrado?)");
                return;
            }
            
            // 2. Assign
            const { error } = await supabase.from('company_users').insert({
                company_id: selectedCompany.id,
                user_id: users.id,
                role: 'admin'
            });

            if (error) throw error;
            showToast("Usuario asignado correctamente");
            setAssignEmail('');
        } catch (error) {
            console.error(error);
            showToast("Error al asignar (¿Ya asignado?)");
        }
    };

    const filtered = companies.filter(c => 
        (c.razon_social || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.rut || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full animate-slide-in">
             {toastMessage && <div className="toast-notification info">{toastMessage}</div>}
            
            <div className="glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onBack} className="icon-btn-secondary" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--mobile-text)' }}>Gestión Empresas</h2>
                <div style={{ width: '2.5rem' }} />
            </div>

            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                 <div className="input-icon-wrapper" style={{ marginBottom: '1rem' }}>
                    <span className="material-icons-round">search</span>
                    <input 
                        className="system-input" 
                        placeholder="Buscar empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? <div className="loading-spinner mx-auto" /> : (
                    <div className="system-list-container">
                        {filtered.map(comp => (
                            <button 
                                key={comp.id} 
                                className="system-list-item"
                                style={{ width: '100%' }}
                                onClick={() => setSelectedCompany(comp)}
                            >
                                <div className="avatar-wrapper" style={{ width: '2.5rem', height: '2.5rem', background: '#3b82f620', border: '1px solid #3b82f640' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1.25rem', color: '#3b82f6' }}>business</span>
                                </div>
                                <div className="item-info" style={{ textAlign: 'left' }}>
                                    <div className="item-title">{comp.razon_social}</div>
                                    <div className="item-email">{comp.rut}</div>
                                </div>
                                <span className="material-icons-round" style={{ color: 'var(--mobile-text-muted)' }}>edit</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

             {/* Detail Modal */}
             {selectedCompany && (
                <div className="modal-overlay bottom-sheet" onClick={() => setSelectedCompany(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '0.25rem' }}>{selectedCompany.razon_social}</h3>
                        <p style={{ fontFamily: 'monospace', color: '#10b981', marginBottom: '1.5rem' }}>{selectedCompany.rut}</p>
                        
                        {/* URL Drive Section */}
                         <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            <label className="section-label">Carpeta Google Drive (Link)</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input 
                                    className="system-input" 
                                    placeholder="https://drive.google.com/..."
                                    value={editDriveUrl}
                                    onChange={e => setEditDriveUrl(e.target.value)}
                                />
                                <button className="btn-primary" onClick={handleSaveDriveUrl} style={{ width: 'auto', padding: '0 1rem' }}>
                                    <span className="material-icons-round">save</span>
                                </button>
                            </div>
                        </div>

                        {/* Assign User Section */}
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            <label className="section-label">Asignar Cliente (Gmail)</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input 
                                    className="system-input" 
                                    placeholder="ejemplo@gmail.com"
                                    value={assignEmail}
                                    onChange={e => setAssignEmail(e.target.value)}
                                />
                                <button className="btn-primary" onClick={handleAssignUser} style={{ width: 'auto', padding: '0 1rem' }}>
                                    <span className="material-icons-round">person_add</span>
                                </button>
                            </div>
                        </div>

                        <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setSelectedCompany(null)}>Cerrar</button>
                    </div>
                </div>
             )}
        </div>
    );
};

const MobileAdmin: React.FC = () => {
    const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'requests' | 'leads' | 'companies'>('dashboard');
    const [stats, setStats] = useState({ users: 0, requests: 0, leads: 0 });

    useEffect(() => {
        const fetchStats = async () => {
             try {
                const userCount = await supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
                const lReq = await supabase.from('guest_leads').select('id', { count: 'exact', head: true });
                
                // Assuming 'tasks' table might also have accounting tasks later, but for now leads are the main inbound
                setStats({ 
                    users: userCount.count || 0, 
                    requests: lReq.count || 0, // Using leads count for requests/tickets
                    leads: lReq.count || 0 
                });
             } catch (e) {
                 console.error("Error fetching stats", e);
             }
        };
        fetchStats();
    }, []);

    const adminModules = [
        { id: 'leads', label: 'Leads (CRM)', icon: 'contact_phone', view: 'leads', desc: 'Capturas web' },
        { id: 'users', label: 'Usuarios', icon: 'people', view: 'users', desc: 'Gestionar acceso' },
        { id: 'companies', label: 'Empresas', icon: 'business', view: 'companies', desc: 'Clientes y RUTs' },
        { id: 'requests', label: 'Solicitudes', icon: 'inbox', view: 'requests', desc: 'Aprobar tickets' },
        { id: 'documents', label: 'Archivos', icon: 'folder', desc: 'Docs clientes' },
        { id: 'analytics', label: 'Reportes', icon: 'bar_chart', desc: 'Estadísticas' },
    ];

    return (
        <div className="mobile-view-container system-bg-void">
            <div className="mobile-content-scroll">
                {currentView === 'dashboard' ? (
                    <div style={{ padding: '1.5rem 1rem 6rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h1 style={{ 
                                    fontSize: '1.5rem', 
                                    fontWeight: 700, 
                                    color: 'var(--mobile-text)',
                                    marginBottom: '0.25rem'
                                }}>
                                    HOLA, ADMIN
                                </h1>
                                <p style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--mobile-primary)', 
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    fontWeight: 600
                                }}>
                                    {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}
                                </p>
                            </div>
                            <span className="material-icons-round" style={{ 
                                color: 'var(--mobile-primary)', 
                                fontSize: '2.5rem',
                                filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))'
                            }}>
                                admin_panel_settings
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem', marginBottom: '2rem' }}>
                            <div className="highlight-card" style={{ minHeight: 'auto', padding: '1rem 0.5rem' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--mobile-primary)', marginBottom: '0.2rem' }}>
                                    {stats.users}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--mobile-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Usuarios
                                </div>
                            </div>
                            <div className="highlight-card" style={{ minHeight: 'auto', padding: '1rem 0.5rem' }}>
                                <div style={{ 
                                    fontSize: '1.5rem', 
                                    fontWeight: 700, 
                                    color: stats.requests > 0 ? '#f87171' : 'var(--mobile-primary)',
                                    marginBottom: '0.2rem'
                                }}>
                                    {stats.requests}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--mobile-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Tickets
                                </div>
                            </div>
                            <div className="highlight-card" style={{ minHeight: 'auto', padding: '1rem 0.5rem', border: '1px solid #10b981' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginBottom: '0.2rem' }}>
                                    {stats.leads}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--mobile-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Leads
                                </div>
                            </div>
                        </div>
                        
                        <h3 className="section-label" style={{ marginBottom: '1rem' }}>Sistema</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                            {adminModules.map((module) => (
                                <button 
                                    key={module.id}
                                    className="highlight-card"
                                    style={{ minHeight: '8rem' }}
                                    onClick={() => module.view && setCurrentView(module.view as any)}
                                >
                                    <span className="material-icons-round" style={{ 
                                        fontSize: '2.5rem', 
                                        color: 'var(--mobile-primary)',
                                        marginBottom: '0.75rem',
                                        filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))'
                                    }}>
                                        {module.icon}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--mobile-text)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                            {module.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--mobile-text-muted)', fontWeight: 500 }}>
                                            {module.desc}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : currentView === 'users' ? (
                    <UsersView onBack={() => setCurrentView('dashboard')} />
                ) : currentView === 'leads' ? (
                    <LeadsView onBack={() => setCurrentView('dashboard')} />
                ) : currentView === 'requests' ? (
                    <RequestsView onBack={() => setCurrentView('dashboard')} />
                ) : currentView === 'companies' ? (
                    <CompaniesView onBack={() => setCurrentView('dashboard')} />
                ) : null}
            </div>
        </div>
    );
};

export default MobileAdmin;
