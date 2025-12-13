import React, { useState, useEffect } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

const MobileMeetings: React.FC = () => {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Schedule Modal State
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    
    // Derived state for calendar strip
    const startOfWeek = new Date(selectedDate);
    // startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Start from Monday or simply center around selected

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('meetings')
                .select('*')
                .eq('user_id', user.id)
                .order('meeting_date', { ascending: true });

            if (error) throw error;
            setMeetings(data || []);
        } catch (error) {
            console.error('Error fetching meetings:', error);
            showToast('Error cargando reuniones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    const handleSchedule = async () => {
        if (!newTitle || !newDate || !newTime) {
            showToast("Completa todos los campos");
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

             const dateTimeStr = `${newDate}T${newTime}:00`;
             const { error } = await supabase
                .from('meetings')
                .insert([{
                    user_id: user.id,
                    title: newTitle,
                    meeting_date: dateTimeStr,
                    duration_minutes: 60,
                    status: 'scheduled',
                    type: 'video' // Default
                }]);

            if (error) throw error;
            showToast("Reunión agendada");
            setShowScheduleModal(false);
            setNewTitle('');
            fetchMeetings();
        } catch (e) {
            console.error(e);
            showToast("Error al crear reunión");
        }
    };

    const renderCalendarStrip = () => {
        const days = [];
        // Show 7 days starting from today or selected date context
        // Simple approach: Show today + 6 days forward for actionable agenda
        const baseDate = new Date(); 
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() + i);
            const isSelected = d.toDateString() === selectedDate.toDateString();
            
            days.push(
                <button 
                    key={i} 
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[3.5rem] transition-all ${
                        isSelected 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                        : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                    }`}
                    onClick={() => setSelectedDate(d)}
                >
                    <span className="text-[10px] uppercase font-bold opacity-80">
                        {d.toLocaleDateString('es-CL', { weekday: 'short' }).slice(0, 3)}
                    </span>
                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {d.getDate()}
                    </span>
                </button>
            );
        }
        return <div className="flex gap-2 overflow-x-auto pb-4 pt-2 px-1 no-scrollbar">{days}</div>;
    };

    // Filter meetings for selected date
    const dailyMeetings = meetings.filter(m => 
        new Date(m.meeting_date).toDateString() === selectedDate.toDateString()
    );

    return (
        <div className="mobile-view-container relative h-full flex flex-col bg-slate-900">
             {toastMessage && (
                <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }} className="status-badge success animate-fade-in shadow-lg">
                    {toastMessage}
                </div>
            )}

            <div className="glass-header">
                <div>
                     <h1 className="text-lg font-bold text-gradient">Agenda</h1>
                     <p className="text-xs text-gray-400">Próximas reuniones</p>
                </div>
                 <button 
                    onClick={() => setShowScheduleModal(true)}
                    className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
                >
                    <span className="material-icons-round text-white">add</span>
                </button>
            </div>

            <div className="mobile-scroll-content px-4 pb-24 pt-4">
                {/* Calendar Strip */}
                <div className="mb-4">
                    {renderCalendarStrip()}
                </div>

                {loading ? (
                    <div className="flex justify-center py-10"><div className="loader"></div></div>
                ) : (
                    <div className="flex flex-col gap-3">
                         {dailyMeetings.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                                <span className="material-icons-round text-5xl mb-2 opacity-20">event_busy</span>
                                <p>No hay reuniones para este día</p>
                                <button className="mt-4 mobile-btn-ghost text-xs" onClick={() => setShowScheduleModal(true)}>
                                    + Agendar ahora
                                </button>
                            </div>
                        ) : (
                            dailyMeetings.map((meeting, idx) => {
                                const mDate = new Date(meeting.meeting_date);
                                // Simple "isLive" logic: if accurate time range matches now
                                const isLive = meeting.status === 'En curso' || (
                                    mDate <= new Date() && 
                                    (new Date(mDate.getTime() + (meeting.duration_minutes || 60) * 60000)) > new Date()
                                );

                                return (
                                    <div 
                                        key={meeting.id} 
                                        className={`premium-card p-4 rounded-xl group relative overflow-hidden animate-slide-up ${isLive ? 'border-green-500/50 shadow-green-500/10' : ''}`}
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        {isLive && (
                                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-lg animate-pulse">
                                                EN VIVO
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-3">
                                                <div className={`p-3 rounded-xl flex items-center justify-center ${
                                                    meeting.type === 'video' ? 'bg-purple-900/20 text-purple-400' : 'bg-blue-900/20 text-blue-400'
                                                }`}>
                                                    <span className="material-icons-round">
                                                        {meeting.type === 'video' ? 'videocam' : 'location_on'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-sm line-clamp-1">{meeting.title}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                        <span className="material-icons-round text-[12px]">schedule</span>
                                                        {mDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(mDate.getTime() + (meeting.duration_minutes || 60) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-3">
                                            {meeting.link && (
                                                <a 
                                                    href={meeting.link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="mobile-btn-primary flex-1 justify-center text-xs py-2 shadow-lg shadow-blue-500/20"
                                                >
                                                    Unirse
                                                </a>
                                            )}
                                            <button className="mobile-btn-ghost flex-1 justify-center text-xs py-2 border-gray-700 text-gray-300">
                                                Detalles
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                    <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                            <h3 className="text-lg font-bold text-white">Agendar Reunión</h3>
                            <button onClick={() => setShowScheduleModal(false)}>
                                <span className="material-icons-round text-gray-400">close</span>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Título</label>
                                <input 
                                    className="mobile-input bg-gray-900 border-gray-700 w-full" 
                                    placeholder="Motivo de la reunión" 
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Fecha</label>
                                    <input 
                                        type="date" 
                                        className="mobile-input bg-gray-900 border-gray-700 w-full" 
                                        value={newDate}
                                        onChange={e => setNewDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Hora</label>
                                    <input 
                                        type="time" 
                                        className="mobile-input bg-gray-900 border-gray-700 w-full" 
                                        value={newTime}
                                        onChange={e => setNewTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button 
                                className="mobile-btn-primary w-full justify-center mt-4"
                                onClick={handleSchedule}
                            >
                                Confirmar Agendamiento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileMeetings;
