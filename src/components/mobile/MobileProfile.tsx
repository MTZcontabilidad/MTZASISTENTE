import React, { useEffect, useState } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

const MobileProfile: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form States
    const [formName, setFormName] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formCompany, setFormCompany] = useState("");
    const [formGiro, setFormGiro] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [securityEnabled, setSecurityEnabled] = useState(true);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || "");
                
                // Fetch all data in parallel
                const [userProfile, clientInfo, companyInfo] = await Promise.all([
                    supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
                    supabase.from('client_extended_info').select('*').eq('id', user.id).maybeSingle(),
                    supabase.from('companies').select('*').eq('user_id', user.id).maybeSingle()
                ]);

                const combinedData = {
                    ...userProfile.data,
                    ...clientInfo.data,
                    company_data: companyInfo.data || {}
                };

                setProfile(combinedData);
                
                // Set Form Initial State
                setFormName(userProfile.data?.full_name || clientInfo.data?.preferred_name || "");
                setFormPhone(companyInfo.data?.contacto_fono || "");
                setFormCompany(companyInfo.data?.razon_social || "");
                setFormGiro(companyInfo.data?.giro || clientInfo.data?.business_activity || "");
            }
        } catch (error) {
            console.error("Error loading profile:", error);
            showToast("Error cargando perfil");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            showToast("Guardando cambios...");
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) return;

            // Update user_profiles (Name)
            if (formName) {
                await supabase.from('user_profiles').update({ full_name: formName }).eq('id', user.id);
            }

            // Update companies (Phone, Company Name, Giro)
            // Check if company exists, if not maybe create? For now assume update or upsert
            // Actually, we should upsert companies if it doesn't exist, but let's try update first or use upsert.
            const companyData = {
                user_id: user.id,
                contacto_fono: formPhone,
                razon_social: formCompany,
                giro: formGiro
            };

            const { error: companyError } = await supabase.from('companies').upsert(companyData, { onConflict: 'user_id' });
            if (companyError) throw companyError;

             // Update client_extended_info (Business Activity/Giro backup)
            await supabase.from('client_extended_info').upsert({
                id: user.id,
                business_activity: formGiro,
                preferred_name: formName
            });

            setIsEditing(false);
            showToast("Perfil actualizado correctamente");
            loadProfile(); // Refresh
        } catch (error) {
            console.error("Error saving profile:", error);
            showToast("Error al guardar cambios");
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            handleSaveProfile();
        } else {
            setIsEditing(true);
        }
    };

    const handleLogout = async () => {
        showToast("Cerrando sesión...");
        await supabase.auth.signOut();
        window.location.reload(); 
    };

    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
        showToast(!notificationsEnabled ? "Notificaciones activadas" : "Notificaciones desactivadas");
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full text-white">Cargando perfil...</div>;
    }

    return (
        <div className="mobile-view-container relative h-full flex flex-col bg-slate-900">
             {toastMessage && (
                <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }} className="status-badge success animate-fade-in shadow-lg">
                    {toastMessage}
                </div>
            )}

            <div className="glass-header">
                <div>
                     <h1 className="text-lg font-bold text-gradient">Mi Perfil</h1>
                     <p className="text-xs text-gray-400">Gestiona tu cuenta</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center border border-blue-500/30">
                     <span className="material-icons-round text-blue-400">person</span>
                </div>
            </div>

            <div className="mobile-scroll-content px-4 pb-24 pt-4">
                <div className="flex flex-col items-center mb-6 animate-slide-in">
                    <div className="relative group">
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/50 animate-spin-slow"></div>
                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-900 shadow-xl overflow-hidden relative">
                             {/* Placeholder for avatar image if available, else icon */}
                             <span className="material-icons-round text-5xl text-gray-500">person</span>
                        </div>
                        <button 
                            className={`absolute bottom-0 right-0 p-2 rounded-full border-2 border-slate-900 shadow-lg transition-all active:scale-95 ${isEditing ? 'bg-green-500 text-white' : 'bg-cyan-500 text-white'}`}
                            onClick={handleEditToggle}
                        >
                            <span className="material-icons-round text-sm">{isEditing ? 'check' : 'edit'}</span>
                        </button>
                    </div>
                    <div className="text-center mt-3">
                        <h2 className="text-xl font-bold text-white">{formName || "Usuario"}</h2>
                        <p className="text-xs text-gray-400">{userEmail}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                    
                    {/* Personal Info */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Información Personal</h3>
                            {isEditing && <span className="text-xs text-green-400 font-medium animate-pulse">Editando...</span>}
                        </div>
                        
                        <div className="premium-card p-0 rounded-xl overflow-hidden divide-y divide-gray-800">
                             {/* Name */}
                            <div className="p-4 flex items-center gap-3">
                                <span className={`material-icons-round ${isEditing ? 'text-green-500' : 'text-gray-500'}`}>badge</span>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Nombre Completo</label>
                                    <input 
                                        className={`w-full bg-transparent text-sm text-white outline-none transition-all ${isEditing ? 'border-b border-green-500/50 pb-1' : ''}`}
                                        value={formName} 
                                        onChange={(e) => setFormName(e.target.value)}
                                        readOnly={!isEditing} 
                                    />
                                </div>
                            </div>
                            
                            {/* Phone */}
                            <div className="p-4 flex items-center gap-3">
                                <span className={`material-icons-round ${isEditing ? 'text-green-500' : 'text-gray-500'}`}>phone</span>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Teléfono</label>
                                    <input 
                                        className={`w-full bg-transparent text-sm text-white outline-none transition-all ${isEditing ? 'border-b border-green-500/50 pb-1' : ''}`}
                                        type="tel"
                                        value={formPhone} 
                                        onChange={(e) => setFormPhone(e.target.value)}
                                        readOnly={!isEditing} 
                                    />
                                </div>
                            </div>

                            {/* Company */}
                            <div className="p-4 flex items-center gap-3">
                                <span className={`material-icons-round ${isEditing ? 'text-green-500' : 'text-gray-500'}`}>business</span>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Empresa</label>
                                    <input 
                                        className={`w-full bg-transparent text-sm text-white outline-none transition-all ${isEditing ? 'border-b border-green-500/50 pb-1' : ''}`}
                                        value={formCompany} 
                                        onChange={(e) => setFormCompany(e.target.value)}
                                        readOnly={!isEditing} 
                                    />
                                </div>
                            </div>

                             {/* Giro */}
                             <div className="p-4 flex items-center gap-3">
                                <span className={`material-icons-round ${isEditing ? 'text-green-500' : 'text-gray-500'}`}>work</span>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Giro / Actividad</label>
                                    <input 
                                        className={`w-full bg-transparent text-sm text-white outline-none transition-all ${isEditing ? 'border-b border-green-500/50 pb-1' : ''}`}
                                        value={formGiro} 
                                        onChange={(e) => setFormGiro(e.target.value)}
                                        readOnly={!isEditing} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Configuración</h3>
                        <div className="premium-card p-0 rounded-xl overflow-hidden divide-y divide-gray-800">
                             <button 
                                onClick={toggleNotifications}
                                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-950 text-gray-400">
                                        <span className="material-icons-round">notifications</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-200">Notificaciones</span>
                                </div>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notificationsEnabled ? 'left-5' : 'left-1'}`}></div>
                                </div>
                            </button>

                            <button 
                                onClick={() => setSecurityEnabled(!securityEnabled)}
                                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-950 text-gray-400">
                                        <span className="material-icons-round">lock</span>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-200">Biometría</div>
                                        <div className="text-[10px] text-gray-500">FaceID / TouchID</div>
                                    </div>
                                </div>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${securityEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${securityEnabled ? 'left-5' : 'left-1'}`}></div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Logout */}
                    <div className="pt-4 pb-6">
                        <button 
                            onClick={handleLogout}
                            className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 active:scale-95 transition-all"
                        >
                            <span className="material-icons-round">logout</span>
                            Cerrar Sesión
                        </button>
                        <p className="text-center text-[10px] text-gray-600 mt-4">MTZ Ouroborus AI v2.0.4 • MTZ Corp</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileProfile;
