import React, { useState, useEffect } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

const UsersView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Edit Form State
    const [editForm, setEditForm] = useState({ fullName: '', role: '', isActive: false });

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
            role: user.role || 'client',
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

    const filteredUsers = users.filter(user => 
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-slide-in relative h-full flex flex-col">
            {toastMessage && (
                <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }} className="status-badge success animate-fade-in">
                    {toastMessage}
                </div>
            )}

            <div className="glass-header">
                <button onClick={onBack} className="mobile-icon-btn" style={{ padding: '0.5rem' }}>
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h2 className="text-lg font-bold text-gradient">Gestión de Usuarios</h2>
                <div style={{ width: '2rem' }} /> {/* Spacer */}
            </div>

            <div style={{ padding: '0 1rem 1rem' }}>
                <div className="mobile-input-group glass-input-wrapper mb-4 flex items-center px-3 border border-white/10 rounded-xl" style={{ margin: '1rem 0' }}>
                    <span className="material-icons-round text-gray-400 mr-2">search</span>
                    <input 
                        className="bg-transparent border-none w-full text-sm text-white outline-none placeholder-gray-500 py-2" 
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-10"><div className="loader"></div></div>
                ) : (
                    <div className="flex flex-col gap-3 pb-20">
                        {filteredUsers.map(user => (
                            <button 
                                key={user.id} 
                                className="premium-card text-left p-4 flex items-center gap-4"
                                onClick={() => handleUserClick(user)}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="Avg" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-icons-round text-gray-400">person</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white truncate">{user.full_name || 'Sin Nombre'}</div>
                                    <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                                </div>
                                <div className={`status-badge ${user.is_active ? 'success' : 'neutral'}`}>
                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                </div>
                            </button>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="text-center text-gray-400 py-8">No se encontraron usuarios</div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal - Bottom Sheet */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">Editar Usuario</h3>
                                <p className="text-xs text-gray-400">{selectedUser.email}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Nombre Completo</label>
                                <input 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={editForm.fullName}
                                    onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Rol</label>
                                <select 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={editForm.role}
                                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                                >
                                    <option value="client">Cliente</option>
                                    <option value="admin">Administrador</option>
                                    <option value="inclusion">Inclusión</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <span className="text-sm text-gray-300">Estado Activo</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={editForm.isActive}
                                        onChange={e => setEditForm({...editForm, isActive: e.target.checked})}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <button 
                                onClick={handleSaveUser}
                                className="mobile-btn-primary mt-4"
                            >
                                Guardar Cambios
                            </button>
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
            const [transportRes, workshopRes] = await Promise.all([
                supabase.from('transport_requests').select('*').order('created_at', { ascending: false }).limit(20),
                supabase.from('wheelchair_workshop_requests').select('*').order('created_at', { ascending: false }).limit(20)
            ]);

            const transport = (transportRes.data || []).map(r => ({ ...r, type: 'Traslado', icon: 'directions_car', sourceTable: 'transport_requests', name: r.passenger_name || r.client_name || 'Usuario' }));
            const workshop = (workshopRes.data || []).map(r => ({ ...r, type: 'Taller', icon: 'build', sourceTable: 'wheelchair_workshop_requests', name: r.client_name || 'Usuario' }));

            const combined = [...transport, ...workshop].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

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
            showToast(action === 'approved' ? "Aprobando..." : "Rechazando...");
            const { error } = await supabase.from(table).update({ status: action }).eq('id', id);
            if (error) throw error;
            
            showToast(`Solicitud ${action === 'approved' ? 'aprobada' : 'rechazada'}`);
            fetchRequests(); // Refresh
        } catch (error) {
            console.error("Error updating request:", error);
            showToast("Error al procesar solicitud");
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `Hace ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hace ${hours} h`;
        return `Hace ${Math.floor(hours / 24)} d`;
    };

    const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === 'pending');

    return (
        <div className="animate-slide-in relative h-full flex flex-col">
             {toastMessage && (
                <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }} className="status-badge success animate-fade-in">
                    {toastMessage}
                </div>
            )}

            <div className="glass-header">
                <button onClick={onBack} className="mobile-icon-btn" style={{ padding: '0.5rem' }}>
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h2 className="text-lg font-bold text-gradient">Solicitudes</h2>
                <div style={{ width: '2rem' }} />
            </div>

            <div className="px-4 py-2 border-b border-gray-800 flex gap-2 overflow-x-auto">
                 <button 
                    className={`tag-btn ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                 >
                    Pendientes
                 </button>
                 <button 
                    className={`tag-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                 >
                    Historial
                 </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><div className="loader"></div></div>
            ) : (
                <div className="p-4 space-y-4 pb-20 overflow-y-auto">
                    {filteredRequests.map(req => (
                        <div key={req.id} className="premium-card p-4 rounded-2xl animate-scale-in">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-3 items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${req.type === 'Traslado' ? 'bg-blue-900/30 text-blue-400' : 'bg-orange-900/30 text-orange-400'}`}>
                                        <span className="material-icons-round">{req.icon}</span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white">{req.type}</div>
                                        <div className="text-xs text-gray-400">{timeAgo(req.created_at)}</div>
                                    </div>
                                </div>
                                <div className={`status-badge ${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'warning'}`}>
                                    {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                </div>
                            </div>
                            
                            <div className="text-sm text-gray-300 mb-4 pl-1">
                                Solicitud creada por <span className="font-bold text-white">{req.name}</span>
                            </div>

                            {req.status === 'pending' && (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleAction(req.id, req.sourceTable, 'rejected')}
                                        className="mobile-btn-ghost text-red-400 border-red-900/30 hover:bg-red-900/20 text-sm justify-center" 
                                    >
                                        Rechazar
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req.id, req.sourceTable, 'approved')}
                                        className="mobile-btn-primary text-sm justify-center" 
                                        style={{ height: 'auto', padding: '0.75rem' }}
                                    >
                                        Aprobar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredRequests.length === 0 && (
                         <div className="text-center py-10 text-gray-500">
                            No hay solicitudes {filter === 'pending' ? 'pendientes' : ''}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MobileAdmin: React.FC = () => {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'requests'>('dashboard');
    const [stats, setStats] = useState({ users: 0, requests: 0 });

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        const fetchStats = async () => {
             try {
                const userCount = await supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
                
                // Fetch pending requests count
                const tReq = await supabase.from('transport_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending');
                const wReq = await supabase.from('wheelchair_workshop_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending');
                
                setStats({
                    users: userCount.count || 0,
                    requests: (tReq.count || 0) + (wReq.count || 0)
                });
             } catch (e) {
                 console.error("Error fetching stats", e);
             }
        };
        fetchStats();
    }, []);

    const adminModules = [
        { id: 'users', label: 'Usuarios', icon: 'people', color: 'blue', view: 'users', desc: 'Gestionar acceso' },
        { id: 'requests', label: 'Solicitudes', icon: 'inbox', color: 'red', view: 'requests', desc: 'Aprobar tickets' },
        { id: 'meetings', label: 'Agenda', icon: 'calendar_month', color: 'purple', desc: 'Ver reuniones' },
        { id: 'documents', label: 'Archivos', icon: 'folder', color: 'green', desc: 'Docs clientes' },
        { id: 'analytics', label: 'Reportes', icon: 'bar_chart', color: 'orange', desc: 'Estadísticas' },
        { id: 'settings', label: 'Config', icon: 'settings', color: 'gray', desc: 'Ajustes app' }
    ];

    const handleModuleClick = (module: any) => {
        if (module.view) {
            setCurrentView(module.view as any);
        } else {
            showToast(`Módulo ${module.label}: Próximamente`);
        }
    };

    return (
        <div className="mobile-view-container">
            {toastMessage && (
                <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }} className="status-badge neutral animate-fade-in shadow-lg backdrop-blur-md">
                    {toastMessage}
                </div>
            )}

            <div className="mobile-scroll-content relative">
                {currentView === 'dashboard' ? (
                    <>
                        <div className="pt-2 pb-6 px-2 animate-slide-in">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                        Hola, Admin
                                    </h1>
                                    <p className="text-sm text-gray-400">{new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-lg border border-blue-400/30">
                                    <span className="material-icons-round text-white">admin_panel_settings</span>
                                </div>
                            </div>

                            {/* Stats Cards Row */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="premium-card p-4">
                                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                                        <span className="material-icons-round text-lg">group</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">Usuarios</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.users}</div>
                                    <div className="text-xs text-gray-400">Activos en plataforma</div>
                                </div>
                                <div className={`premium-card p-4 ${stats.requests > 0 ? 'border-red-500/30' : ''}`}>
                                    <div className={`flex items-center gap-2 mb-2 ${stats.requests > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        <span className="material-icons-round text-lg">notifications</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">Pendientes</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.requests}</div>
                                    <div className="text-xs text-gray-400">Necesitan atención</div>
                                </div>
                            </div>
                            
                            <h3 className="section-title mb-3">Herramientas</h3>
                            <div className="grid grid-cols-2 gap-3 pb-20">
                                {adminModules.map((module, idx) => {
                                    // Color mapping for Tailwind
                                    const colorMap: Record<string, string> = {
                                        blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
                                        red: 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20',
                                        purple: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20',
                                        green: 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20',
                                        orange: 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20',
                                        gray: 'bg-gray-500/10 text-gray-400 group-hover:bg-gray-500/20',
                                    };
                                    
                                    return (
                                        <button 
                                            key={module.id}
                                            className="premium-card p-4 text-left group hover:scale-[1.02] transition-all"
                                            onClick={() => handleModuleClick(module)}
                                            style={{ animationDelay: `${idx * 0.05}s` }}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${colorMap[module.color] || colorMap.gray}`}>
                                                <span className="material-icons-round">{module.icon}</span>
                                            </div>
                                            <div className="font-semibold text-white mb-1">{module.label}</div>
                                            <div className="text-xs text-gray-500">{module.desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : currentView === 'users' ? (
                    <UsersView onBack={() => setCurrentView('dashboard')} />
                ) : currentView === 'requests' ? (
                    <RequestsView onBack={() => setCurrentView('dashboard')} />
                ) : null}
            </div>
        </div>
    );
};

export default MobileAdmin;
