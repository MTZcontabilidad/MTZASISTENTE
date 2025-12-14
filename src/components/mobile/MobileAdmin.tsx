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
                                    <span className="material-icons-round" style={{ fontSize: '1rem' }}>person</span>
                                </div>
                                <div className="item-info" style={{ textAlign: 'left' }}>
                                    <div className="item-title">{user.full_name || 'Sin Nombre'}</div>
                                    <div className="item-subtitle" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                        {user.role} • {user.is_active ? 'Activo' : 'Inactivo'}
                                    </div>
                                </div>
                                <span className="material-icons-round" style={{ color: 'var(--mobile-text-muted)', fontSize: '1.25rem' }}>chevron_right</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {selectedUser && (
                <div className="modal-overlay bottom-sheet" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Editar Usuario</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label className="section-label">Nombre Completo</label>
                                <input 
                                    className="system-input"
                                    value={editForm.fullName}
                                    onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="section-label">Rol</label>
                                <select 
                                    className="system-input"
                                    value={editForm.role}
                                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                                >
                                    <option value="client">Cliente</option>
                                    <option value="admin">Administrador</option>
                                    <option value="staff">Staff</option>
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
                                <span style={{ color: 'var(--mobile-text)', fontWeight: 600 }}>Estado Activo</span>
                                <div 
                                    className={`toggle-switch ${editForm.isActive ? 'active' : ''}`}
                                    onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})}
                                >
                                    <div className="toggle-knob"></div>
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveUser} 
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '0.5rem' }}
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
            const combined = [...transport, ...workshop].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
            fetchRequests();
        } catch (error) {
            console.error("Error updating request:", error);
            showToast("Error al procesar solicitud");
        }
    };

    const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === 'pending');

    return (
        <div className="flex flex-col h-full animate-slide-in">
             {toastMessage && <div className="toast-notification success">{toastMessage}</div>}

            <div className="glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onBack} className="icon-btn-secondary" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--mobile-text)' }}>Solicitudes</h2>
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
                                    {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--mobile-text)', marginBottom: '0.75rem' }}>
                                Solicitado por: <b>{req.name}</b>
                            </div>
                            {req.status === 'pending' && (
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
                                        Rechazar
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req.id, req.sourceTable, 'approved')} 
                                        className="btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        Aprobar
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
                            <p className="empty-subtitle">No hay solicitudes</p>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
    );
};

const MobileAdmin: React.FC = () => {
    const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'requests'>('dashboard');
    const [stats, setStats] = useState({ users: 0, requests: 0 });

    useEffect(() => {
        const fetchStats = async () => {
             try {
                const userCount = await supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
                const tReq = await supabase.from('transport_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending');
                const wReq = await supabase.from('wheelchair_workshop_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending');
                setStats({ users: userCount.count || 0, requests: (tReq.count || 0) + (wReq.count || 0) });
             } catch (e) {
                 console.error("Error fetching stats", e);
             }
        };
        fetchStats();
    }, []);

    const adminModules = [
        { id: 'users', label: 'Usuarios', icon: 'people', view: 'users', desc: 'Gestionar acceso' },
        { id: 'requests', label: 'Solicitudes', icon: 'inbox', view: 'requests', desc: 'Aprobar tickets' },
        { id: 'meetings', label: 'Agenda', icon: 'calendar_month', desc: 'Ver reuniones' },
        { id: 'documents', label: 'Archivos', icon: 'folder', desc: 'Docs clientes' },
        { id: 'analytics', label: 'Reportes', icon: 'bar_chart', desc: 'Estadísticas' },
        { id: 'settings', label: 'Config', icon: 'settings', desc: 'Ajustes app' }
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '2rem' }}>
                            <div className="highlight-card" style={{ minHeight: 'auto' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--mobile-primary)', marginBottom: '0.5rem' }}>
                                    {stats.users}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--mobile-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Usuarios
                                </div>
                            </div>
                            <div className="highlight-card" style={{ minHeight: 'auto' }}>
                                <div style={{ 
                                    fontSize: '2rem', 
                                    fontWeight: 700, 
                                    color: stats.requests > 0 ? '#f87171' : 'var(--mobile-primary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    {stats.requests}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--mobile-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Pendientes
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
                ) : currentView === 'requests' ? (
                    <RequestsView onBack={() => setCurrentView('dashboard')} />
                ) : null}
            </div>
        </div>
    );
};

export default MobileAdmin;
