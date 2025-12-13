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
        <div id="mobile-app-root">
            <div className="mobile-view-container">
                 {toastMessage && (
                    <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }} className="status-badge success animate-fade-in shadow-lg">
                        {toastMessage}
                    </div>
                )}

                <header className="glass-header">
                    <div>
                         <h1 className="header-title">Mi Perfil</h1>
                         <p className="header-subtitle">Gestiona tu cuenta</p>
                    </div>
                    <div className="header-icon">
                         <span className="material-icons-round">person</span>
                    </div>
                </header>

                <div className="mobile-content-scroll">
                    
                    {/* AVATAR SECTION */}
                    <div className="profile-avatar-section">
                        <div className="avatar-wrapper">
                            <div className="avatar-spinner"></div>
                            <div className="avatar-circle">
                                 <span className="material-icons-round text-6xl text-gray-400">person</span>
                            </div>
                            <button 
                                className={`avatar-edit-btn ${isEditing ? 'editing' : ''}`}
                                onClick={handleEditToggle}
                            >
                                <span className="material-icons-round text-sm">{isEditing ? 'check' : 'edit'}</span>
                            </button>
                        </div>
                        <div className="flex-col-center">
                            <h2 className="profile-name">{formName || "Usuario"}</h2>
                            <p className="profile-email">{userEmail}</p>
                        </div>
                    </div>

                    <div className="premium-card-list" style={{ animationDelay: '0.1s' }}>
                        
                        {/* PERSONAL INFO */}
                        <div className="mb-6">
                            <div className="section-label">
                                <span>Información Personal</span>
                                {isEditing && <span className="text-xs text-green-400 font-medium animate-pulse">Editando...</span>}
                            </div>
                            
                            <div className="premium-card-list">
                                 {/* Name */}
                                <div className="premium-item">
                                    <div className={`item-icon-box ${isEditing ? 'green' : ''}`}>
                                        <span className="material-icons-round">badge</span>
                                    </div>
                                    <div className="item-content">
                                        <label className="item-label">Nombre Completo</label>
                                        <input 
                                            className={`mobile-input ${isEditing ? 'input-underline' : ''}`}
                                            value={formName} 
                                            onChange={(e) => setFormName(e.target.value)}
                                            readOnly={!isEditing} 
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                </div>
                                
                                {/* Phone */}
                                <div className="premium-item">
                                    <div className={`item-icon-box ${isEditing ? 'green' : ''}`}>
                                        <span className="material-icons-round">phone</span>
                                    </div>
                                    <div className="item-content">
                                        <label className="item-label">Teléfono</label>
                                        <input 
                                            className={`mobile-input ${isEditing ? 'input-underline' : ''}`}
                                            type="tel"
                                            value={formPhone} 
                                            onChange={(e) => setFormPhone(e.target.value)}
                                            readOnly={!isEditing} 
                                        />
                                    </div>
                                </div>

                                {/* Company */}
                                <div className="premium-item">
                                    <div className={`item-icon-box ${isEditing ? 'green' : ''}`}>
                                        <span className="material-icons-round">business</span>
                                    </div>
                                    <div className="item-content">
                                        <label className="item-label">Empresa</label>
                                        <input 
                                            className={`mobile-input ${isEditing ? 'input-underline' : ''}`}
                                            value={formCompany} 
                                            onChange={(e) => setFormCompany(e.target.value)}
                                            readOnly={!isEditing} 
                                        />
                                    </div>
                                </div>

                                 {/* Giro */}
                                 <div className="premium-item">
                                    <div className={`item-icon-box ${isEditing ? 'green' : ''}`}>
                                        <span className="material-icons-round">work</span>
                                    </div>
                                    <div className="item-content">
                                        <label className="item-label">Giro / Actividad</label>
                                        <input 
                                            className={`mobile-input ${isEditing ? 'input-underline' : ''}`}
                                            value={formGiro} 
                                            onChange={(e) => setFormGiro(e.target.value)}
                                            readOnly={!isEditing} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SETTINGS */}
                        <div className="mb-2">
                            <h3 className="section-label">Configuración</h3>
                            <div className="premium-card-list">
                                 <button 
                                    onClick={toggleNotifications}
                                    className="premium-item w-full flex-row-between"
                                    style={{ background: 'rgba(30, 41, 59, 0.4)' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="item-icon-box" style={{ background: 'rgba(15, 23, 42, 0.5)', color: '#94a3b8' }}>
                                            <span className="material-icons-round">notifications</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-200">Notificaciones</span>
                                    </div>
                                    <div className={`toggle-switch ${notificationsEnabled ? 'active' : ''}`}>
                                        <div className="toggle-knob"></div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setSecurityEnabled(!securityEnabled)}
                                    className="premium-item w-full flex-row-between"
                                    style={{ background: 'rgba(30, 41, 59, 0.4)' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="item-icon-box" style={{ background: 'rgba(15, 23, 42, 0.5)', color: '#94a3b8' }}>
                                            <span className="material-icons-round">lock</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-gray-200">Biometría</div>
                                            <div className="text-[10px] text-gray-500">FaceID / TouchID</div>
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
                            <p className="text-center text-[10px] text-gray-600 mt-6 font-mono">MTZ Ouroborus AI v2.0.4 • MTZ Corp</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileProfile;
