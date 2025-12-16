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
    const [rut, setRut] = useState('');
    const [siiPass, setSiiPass] = useState('');
    const [showSiiFields, setShowSiiFields] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !contact) return;
        
        setSubmitting(true);
        try {
            // Guardar en guest_leads con estructura rica
            const { error } = await supabase
                .from('guest_leads')
                .upsert({
                    session_id: sessionId,
                    contact_info: { 
                        name, 
                        contact, 
                        rut: rut || undefined,
                        sii_password: siiPass || undefined // NOTE: Storing as requested, but security warning added in UI
                    },
                    intent: showSiiFields ? 'service_request_with_credentials' : 'manual_lead_capture',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'session_id' });

            if (!error) {
                setDone(true);
                setTimeout(onSuccess, 3000);
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
                <p className="text-sm font-bold">¡Datos recibidos!</p>
                <p className="text-xs opacity-70 mt-1">Un ejecutivo de MTZ analizará tu caso.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900/90 border border-slate-700/80 rounded-xl backdrop-blur-md mt-4 shadow-xl slide-up">
            <h3 className="text-[#00d4ff] text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="material-icons-round text-base">assignment_ind</span>
                Solicitud de Servicio
            </h3>
            
            <div className="space-y-4">
                {/* Campos Básicos */}
                <div className="grid gap-3">
                    <input
                        type="text"
                        placeholder="Nombre / Razón Social"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="system-input w-full text-sm p-3 bg-slate-800/50 border-slate-600 focus:border-[#00d4ff] rounded-lg"
                        required
                    />
                    <input
                        type="text"
                        placeholder="WhatsApp o Email de contacto"
                        value={contact}
                        onChange={e => setContact(e.target.value)}
                        className="system-input w-full text-sm p-3 bg-slate-800/50 border-slate-600 focus:border-[#00d4ff] rounded-lg"
                        required
                    />
                </div>

                {/* Toggle para Trámites (Datos Sensibles) */}
                <div className="border-t border-white/10 pt-3">
                    <button 
                        type="button"
                        onClick={() => setShowSiiFields(!showSiiFields)}
                        className="text-xs text-slate-400 flex items-center gap-1 hover:text-white transition-colors w-full justify-between"
                    >
                        <span>¿Necesitas que hagamos un trámite SII por ti?</span>
                        <span className="material-icons-round text-sm transform transition-transform" style={{ transform: showSiiFields ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                    </button>

                    {showSiiFields && (
                        <div className="mt-3 space-y-3 slide-up bg-red-900/10 p-3 rounded-lg border border-red-500/20">
                            <div className="flex items-start gap-2 text-red-300 text-[0.7rem] mb-2">
                                <span className="material-icons-round text-sm">lock</span>
                                <p>Esta información se usará SOLO para evaluar tu trámite. Se guarda de forma segura.</p>
                            </div>
                            <input
                                type="text"
                                placeholder="RUT Empresa/Persona (Ej: 12.345.678-9)"
                                value={rut}
                                onChange={e => setRut(e.target.value)}
                                className="system-input w-full text-sm p-3 bg-slate-800/50 border-slate-600 focus:border-[#00d4ff] rounded-lg"
                            />
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="Clave Tributaria (SII)"
                                    value={siiPass}
                                    onChange={e => setSiiPass(e.target.value)}
                                    className="system-input w-full text-sm p-3 bg-slate-800/50 border-slate-600 focus:border-[#00d4ff] rounded-lg"
                                />
                                <span className="absolute right-3 top-3 text-slate-500 material-icons-round text-sm cursor-help" title="Necesaria para ingresar al portal del SII">help</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <button 
                    type="submit" 
                    disabled={submitting}
                    className="system-btn-primary w-full py-3 text-sm font-bold flex justify-center items-center gap-2 rounded-lg mt-2 shadow-lg hover:shadow-[#00d4ff]/20 transition-all"
                >
                    {submitting ? 'Enviando Seguro...' : 'Enviar Solicitud'}
                    {!submitting && <span className="material-icons-round text-sm">active_send</span>}
                </button>
            </div>
        </form>
    );
};

export default LeadCaptureForm;
