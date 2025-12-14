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

            <header className="glass-header flex justify-between items-center px-4">
                 <div>
                     <h1 className="text-lg font-bold text-white">{isAdmin ? 'ADMIN PANEL' : 'MIS PEDIDOS'}</h1>
                     <p className="text-xs text-slate-400 uppercase tracking-widest">
                         {isAdmin ? 'Gestión de Solicitudes' : 'Tus Requerimientos'}
                     </p>
                 </div>
                 <button 
                    onClick={() => setShowModal(true)}
                    className="w-10 h-10 flex items-center justify-center text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-500 transition-colors"
                >
                    <span className="material-icons-round">add</span>
                </button>
            </header>

            <div className="mobile-content-scroll">
                {loading ? (
                    <div className="flex justify-center py-10 text-white">
                         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="system-list-container space-y-3">
                         {tasks.length === 0 ? (
                            <div className="flex flex-col items-center py-12 opacity-50">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                     <span className="material-icons-round text-4xl text-slate-600">task_alt</span>
                                </div>
                                <p className="text-slate-400 font-medium">No tienes solicitudes pendientes</p>
                                <button className="btn-ghost mt-4 text-xs" onClick={() => setShowModal(true)}>
                                    CREAR SOLICITUD
                                </button>
                            </div>
                        ) : (
                            tasks.map((task) => {
                                const status = getStatusInfo(task.status);
                                return (
                                    <div key={task.id} className="system-list-item flex-col !items-start !gap-3 !p-4 hover:border-slate-600 transition-colors">
                                        <div className="flex items-center w-full justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${getPriorityColor(task.priority)}`}>
                                                    <span className="material-icons-round text-lg">{getPriorityIcon(task.priority)}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-white text-base truncate pr-2">{task.title}</div>
                                                    <div className="text-xs text-slate-400">
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
                                            <p className="text-sm text-slate-300 w-full pl-11 leading-relaxed">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="w-full flex justify-between items-center pl-11 pt-1">
                                             <span className={`status-badge ${status.type}`}>
                                                <span className="material-icons-round text-[10px]">{status.icon}</span>
                                                {status.label}
                                            </span>

                                            {isAdmin && (
                                                <div className="flex gap-2">
                                                    {task.status !== 'completed' && <button onClick={() => handleStatusChange(task.id, 'completed')} className="text-xs text-green-400 font-bold hover:underline">MARCAR LISTO</button>}
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
                    <div className="modal-content animate-slide-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Nueva Solicitud</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-5">
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
                                    className="system-input h-32 resize-none" 
                                    placeholder="Describe lo que necesitas con detalle..." 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="section-label">Prioridad</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['normal', 'high', 'urgent'] as const).map(p => (
                                        <button 
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`py-2 px-1 rounded-lg text-xs font-bold uppercase transition-all border ${priority === p ? 
                                                'bg-blue-600 border-blue-500 text-white shadow-lg' : 
                                                'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                        >
                                            {p === 'normal' ? 'Normal' : p === 'high' ? 'Alta' : 'Urgente'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <button 
                                className="btn-primary w-full mt-2 !py-4"
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
