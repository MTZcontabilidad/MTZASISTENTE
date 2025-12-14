import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface LeadCaptureFormProps {
    sessionId: string;
    onSuccess: () => void;
}

const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ sessionId, onSuccess }) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !contact) return;
        
        setSubmitting(true);
        try {
            // Guardar en guest_leads
            const { error } = await supabase
                .from('guest_leads')
                .upsert({
                    session_id: sessionId,
                    contact_info: { name, contact },
                    intent: 'manual_form_submission',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'session_id' });

            if (!error) {
                setDone(true);
                setTimeout(onSuccess, 2000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400 text-center animate-pulse">
                <span className="material-icons-round text-2xl mb-1">check_circle</span>
                <p className="text-sm font-bold">¡Datos enviados!</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900/80 border border-slate-700 rounded-lg backdrop-blur-sm mt-2 slide-up">
            <h3 className="text-[#00d4ff] text-sm font-bold mb-3 uppercase tracking-wider">
                <span className="material-icons-round text-xs mr-2 relative top-0.5">contact_mail</span>
                Contacto Rápido
            </h3>
            
            <div className="space-y-3">
                <div>
                    <input
                        type="text"
                        placeholder="Tu Nombre"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="system-input w-full text-sm p-2 bg-slate-800 border-slate-600 focus:border-[#00d4ff]"
                    />
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="WhatsApp o Correo"
                        value={contact}
                        onChange={e => setContact(e.target.value)}
                        className="system-input w-full text-sm p-2 bg-slate-800 border-slate-600 focus:border-[#00d4ff]"
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={submitting}
                    className="system-btn-primary w-full py-2 text-sm font-bold flex justify-center items-center gap-2"
                >
                    {submitting ? 'Enviando...' : 'Enviar Mis Datos'}
                    {!submitting && <span className="material-icons-round text-sm">send</span>}
                </button>
            </div>
        </form>
    );
};

export default LeadCaptureForm;
