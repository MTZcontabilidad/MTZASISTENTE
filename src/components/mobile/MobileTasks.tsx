import React, { useState, useEffect } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    created_at: string;
}

const MobileTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check if admin
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            
            const isUserAdmin = profile?.role === 'admin';
            setIsAdmin(isUserAdmin);

            let query = supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            setTasks(data || []);

        } catch (error) {
            console.error('Error fetching tasks:', error);
            showToast('Error cargando solicitudes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!title.trim()) {
            showToast("Debes poner un título");
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('tasks')
                .insert([{
                    user_id: user.id,
                    title,
                    description,
                    priority,
                    status: 'pending'
                }]);

            if (error) throw error;
            
            showToast("Solicitud enviada");
            setShowModal(false);
            setTitle('');
            setDescription('');
            setPriority('normal');
            fetchTasks();
        } catch (e) {
            console.error(e);
            showToast("Error creando solicitud");
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);
            
            if (error) throw error;
            showToast("Estado actualizado");
            fetchTasks(); 
        } catch (e) {
            console.error(e);
            showToast("Error actualizando estado");
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Pendiente', type: 'warning', icon: 'hourglass_empty' };
            case 'in_progress': return { label: 'En Proceso', type: 'neutral', icon: 'sync' }; // Blueish via neutral override or custom
            case 'completed': return { label: 'Completado', type: 'success', icon: 'check_circle' };
            case 'cancelled': return { label: 'Cancelado', type: 'error', icon: 'cancel' };
            default: return { label: status, type: 'neutral', icon: 'info' };
        }
    };

    const getPriorityIcon = (p: string) => {
        if (p === 'urgent') return 'warning';
        if (p === 'high') return 'priority_high';
        return 'assignment';
    };

    const getPriorityColor = (p: string) => {
         if (p === 'urgent') return 'text-red-400 bg-red-400/10';
         if (p === 'high') return 'text-orange-400 bg-orange-400/10';
         return 'text-blue-400 bg-blue-400/10';
    };

    return (
        <div className="mobile-view-container system-bg-void">
             {toastMessage && (
                <div className="toast-notification success">
                    <span className="material-icons-round text-sm">check</span>
                    {toastMessage}
                </div>
            )}

            <header className="glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                     <h1>{isAdmin ? 'ADMIN PANEL' : 'MIS PEDIDOS'}</h1>
                     <p>
                         {isAdmin ? 'Gestión de Solicitudes' : 'Tus Requerimientos'}
                     </p>
                 </div>
                 <button 
                    onClick={() => setShowModal(true)}
                    className="icon-btn-primary"
                    style={{ width: '2.75rem', height: '2.75rem' }}
                >
                    <span className="material-icons-round">add</span>
                </button>
            </header>

            <div className="mobile-content-scroll">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                         <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <div className="system-list-container">
                         {tasks.length === 0 ? (
                            <div className="empty-state-mobile">
                                <div className="empty-icon">
                                     <span className="material-icons-round">task_alt</span>
                                </div>
                                <p className="empty-title">No tienes solicitudes pendientes</p>
                                <button className="btn-ghost" style={{ marginTop: '1rem', fontSize: '0.75rem' }} onClick={() => setShowModal(true)}>
                                    CREAR SOLICITUD
                                </button>
                            </div>
                        ) : (
                            tasks.map((task) => {
                                const status = getStatusInfo(task.status);
                                return (
                                    <div key={task.id} className="system-list-item" style={{ 
                                        flexDirection: 'column', 
                                        alignItems: 'flex-start', 
                                        gap: '0.875rem',
                                        padding: '1.25rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '2.5rem',
                                                    height: '2.5rem',
                                                    borderRadius: '0.625rem',
                                                    background: task.priority === 'urgent' 
                                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)'
                                                        : task.priority === 'high'
                                                        ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)'
                                                        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                                                    border: `1px solid ${task.priority === 'urgent' ? 'rgba(239, 68, 68, 0.3)' : task.priority === 'high' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                                                    flexShrink: 0
                                                }}>
                                                    <span className="material-icons-round" style={{ 
                                                        fontSize: '1.125rem',
                                                        color: task.priority === 'urgent' ? '#f87171' : task.priority === 'high' ? '#facc15' : 'var(--mobile-primary)'
                                                    }}>
                                                        {getPriorityIcon(task.priority)}
                                                    </span>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="item-title" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{task.title}</div>
                                                    <div className="item-subtitle" style={{ fontSize: '0.75rem' }}>
                                                        {new Date(task.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            {isAdmin && (
                                                 <button className="btn-list-action">
                                                    <span className="material-icons-round">more_vert</span>
                                                </button>
                                            )}
                                        </div>
                                        
                                        {task.description && (
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--mobile-text)',
                                                width: '100%',
                                                paddingLeft: '3.375rem',
                                                lineHeight: 1.6,
                                                margin: 0
                                            }}>
                                                {task.description}
                                            </p>
                                        )}

                                        <div style={{ 
                                            width: '100%', 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            paddingLeft: '3.375rem',
                                            paddingTop: '0.5rem'
                                        }}>
                                             <span className={`status-badge ${status.type}`}>
                                                <span className="material-icons-round">{status.icon}</span>
                                                {status.label}
                                            </span>

                                            {isAdmin && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {task.status !== 'completed' && (
                                                        <button 
                                                            onClick={() => handleStatusChange(task.id, 'completed')} 
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                color: '#4ade80',
                                                                fontWeight: 700,
                                                                background: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                textDecoration: 'underline',
                                                                textUnderlineOffset: '2px'
                                                            }}
                                                        >
                                                            MARCAR LISTO
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Nueva Solicitud</h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="icon-btn-secondary"
                                style={{ width: '2rem', height: '2rem' }}
                            >
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label className="section-label">Título</label>
                                <input 
                                    className="system-input" 
                                    placeholder="Ej: Revisión de IVA..." 
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="section-label">Detalles</label>
                                <textarea 
                                    className="system-input" 
                                    style={{ minHeight: '6rem', resize: 'vertical' }}
                                    placeholder="Describe lo que necesitas con detalle..." 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="section-label">Prioridad</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    {(['normal', 'high', 'urgent'] as const).map(p => (
                                        <button 
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={priority === p ? 'category-filter active' : 'category-filter'}
                                            style={{ fontSize: '0.75rem', padding: '0.625rem 0.5rem' }}
                                        >
                                            {p === 'normal' ? 'Normal' : p === 'high' ? 'Alta' : 'Urgente'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <button 
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }}
                                onClick={handleCreateTask}
                            >
                                <span className="material-icons-round">send</span>
                                ENVIAR SOLICITUD
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileTasks;
