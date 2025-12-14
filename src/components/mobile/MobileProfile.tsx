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

            // Update companies
            const companyData = {
                user_id: user.id,
                contacto_fono: formPhone,
                razon_social: formCompany,
                giro: formGiro
            };

            const { error: companyError } = await supabase.from('companies').upsert(companyData, { onConflict: 'user_id' });
            if (companyError) throw companyError;

             // Update client_extended_info
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
        try {
            showToast("Cerrando sesión...");
            
            // 1. Sign out from Supabase
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // 2. Clear local storage completely to remove any persisted state
            localStorage.clear();
            sessionStorage.clear();

            // 3. Force redirect to root/login
            window.location.href = '/'; 
        } catch (error) {
            console.error("Logout error:", error);
            // Even if error, try to clear local and reload
            localStorage.clear();
            window.location.reload();
        }
    };

    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
        showToast(!notificationsEnabled ? "Notificaciones activadas" : "Notificaciones desactivadas");
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full text-white">Cargando perfil...</div>;
    }

    return (
            <div className="mobile-view-container system-bg-void">
                 {toastMessage && (
                    <div className="toast-notification info">
                        {toastMessage}
                    </div>
                )}

                <header className="glass-header">
                     <h1 className="text-lg font-bold text-white">Perfil</h1>
                     <p className="text-xs text-slate-400">Datos de Usuario</p>
                </header>

                <div className="mobile-content-scroll">
                    
                    {/* AVATAR SECTION */}
                    <div className="profile-avatar-section">
                        <div className="avatar-wrapper">
                             <span className="material-icons-round text-5xl text-slate-400">person</span>
                             <button 
                                className="avatar-edit-btn"
                                onClick={handleEditToggle}
                            >
                                <span className="material-icons-round text-sm">{isEditing ? 'check' : 'edit'}</span>
                            </button>
                        </div>
                        <div>
                            <h2 className="profile-name">{formName || "Usuario"}</h2>
                            <p className="profile-email">{userEmail}</p>
                        </div>
                    </div>

                    <div className="system-list-container">
                        
                        {/* PERSONAL INFO */}
                        <div className="mb-6">
                            <span className="section-label">Información Personal</span>
                            
                            <div className="system-list-container">
                                 {/* Name */}
                                <div className="system-list-item flex-col items-start !gap-2">
                                    <label className="text-xs text-slate-400 uppercase font-semibold">Nombre Completo</label>
                                    <input 
                                        className="system-input"
                                        value={formName} 
                                        onChange={(e) => setFormName(e.target.value)}
                                        readOnly={!isEditing} 
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                
                                {/* Phone */}
                                <div className="system-list-item flex-col items-start !gap-2">
                                    <label className="text-xs text-slate-400 uppercase font-semibold">Teléfono</label>
                                    <input 
                                        className="system-input"
                                        type="tel"
                                        value={formPhone} 
                                        onChange={(e) => setFormPhone(e.target.value)}
                                        readOnly={!isEditing} 
                                        placeholder="+56 9..."
                                    />
                                </div>

                                {/* Company */}
                                <div className="system-list-item flex-col items-start !gap-2">
                                    <label className="text-xs text-slate-400 uppercase font-semibold">Empresa</label>
                                    <input 
                                        className="system-input"
                                        value={formCompany} 
                                        onChange={(e) => setFormCompany(e.target.value)}
                                        readOnly={!isEditing} 
                                        placeholder="Nombre Empresa"
                                    />
                                </div>

                                 {/* Giro */}
                                 <div className="system-list-item flex-col items-start !gap-2">
                                    <label className="text-xs text-slate-400 uppercase font-semibold">Giro / Actividad</label>
                                    <input 
                                        className="system-input"
                                        value={formGiro} 
                                        onChange={(e) => setFormGiro(e.target.value)}
                                        readOnly={!isEditing} 
                                        placeholder="Giro comercial"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SETTINGS */}
                        <div className="mb-2">
                            <h3 className="section-label">Configuración</h3>
                            <div className="system-list-container">
                                 <button 
                                    onClick={toggleNotifications}
                                    className="system-list-item w-full justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="material-icons-round text-slate-400">notifications</span>
                                        <span className="item-title">Notificaciones</span>
                                    </div>
                                    <div className={`toggle-switch ${notificationsEnabled ? 'active' : ''}`}>
                                        <div className="toggle-knob"></div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setSecurityEnabled(!securityEnabled)}
                                    className="system-list-item w-full justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="material-icons-round text-slate-400">lock</span>
                                        <div className="text-left">
                                            <div className="item-title">Biometría</div>
                                            <div className="item-subtitle">FaceID / TouchID</div>
                                        </div>
                                    </div>
                                    <div className={`toggle-switch ${securityEnabled ? 'active' : ''}`}>
                                        <div className="toggle-knob"></div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* LOGOUT */}
                        <div className="pt-4 pb-6">
                            <button 
                                onClick={handleLogout}
                                className="btn-logout"
                            >
                                <span className="material-icons-round">logout</span>
                                Cerrar Sesión
                            </button>
                            <p className="text-center text-[10px] text-gray-600 mt-6 font-mono">MTZ Ouroborus AI v2.0.4</p>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default MobileProfile;
