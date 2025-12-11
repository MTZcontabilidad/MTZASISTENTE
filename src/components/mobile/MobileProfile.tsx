import React, { useEffect, useState } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

const MobileProfile: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserEmail(user.email || "");
                    
                    // Try to fetch extended info
                    const { data: extendedInfo } = await supabase
                        .from('client_extended_info')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();
                    
                    if (extendedInfo) {
                        setProfile(extendedInfo);
                    } else {
                        // Fallback to basic profile or metadata
                        const { data: basicProfile } = await supabase
                            .from('user_profiles')
                            .select('*')
                            .eq('id', user.id)
                            .maybeSingle();
                        setProfile(basicProfile || {});
                    }
                }
            } catch (error) {
                console.error("Error loading profile:", error);
                showToast("Error cargando perfil");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleLogout = async () => {
        showToast("Cerrando sesión...");
        await supabase.auth.signOut();
        window.location.reload(); 
    };

    const handleEditProfile = () => {
        showToast("Editar perfil: Próximamente");
    };

    const handleNotifications = () => {
        showToast("Configuración de notificaciones: Próximamente");
    };

    const handleSecurity = () => {
        showToast("Seguridad y contraseña: Próximamente");
    };

    const handleBack = () => {
         // In a real router usage: history.goBack() or similar
        showToast("Volviendo...");
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full text-white">Cargando perfil...</div>;
    }

    const displayName = profile?.preferred_name || profile?.full_name || "Usuario";
    const displayPhone = profile?.phone || "No registrado";
    const displayCompany = profile?.company_name || "No registrada";

    const [isEditing, setIsEditing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [securityEnabled, setSecurityEnabled] = useState(true);
    
    // Form States
    const [formName, setFormName] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formCompany, setFormCompany] = useState("");

    // Sync init state
    useEffect(() => {
        if (profile) {
            setFormName(profile.preferred_name || profile.full_name || "");
            setFormPhone(profile.phone || "");
            setFormCompany(profile.business_line || profile.company_name || "");
        }
    }, [profile]);

    const handleEditToggle = () => {
        if (isEditing) {
            // Saving
            showToast("Guardando cambios...");
            setTimeout(() => {
                setIsEditing(false);
                showToast("Perfil actualizado correctamente");
                // In real app, we would update Supabase here
            }, 1000);
        } else {
            setIsEditing(true);
        }
    };

    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
        showToast(!notificationsEnabled ? "Notificaciones activadas" : "Notificaciones desactivadas");
    };

    return (
        <div className="mobile-view-container relative">
             {toastMessage && (
                <div style={{
                    position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(59, 130, 246, 0.9)', color: 'white', padding: '0.75rem 1.5rem',
                    borderRadius: '2rem', zIndex: 100, fontSize: '0.875rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    whiteSpace: 'nowrap', backdropFilter: 'blur(4px)'
                }}>
                    {toastMessage}
                </div>
            )}

            <div className="mobile-scroll-content" style={{ paddingTop: '1.5rem' }}>
                <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem', marginBottom: '1.5rem' }}>
                    <div className="profile-avatar-container" style={{ position: 'relative' }}>
                         {/* Glowing ring animation */}
                        <div style={{ position: 'absolute', top: '-4px', left: '-4px', right: '-4px', bottom: '-4px', borderRadius: '50%', border: '2px dashed rgba(0, 212, 255, 0.5)', animation: 'spin 10s linear infinite' }}></div>
                        <span className="material-icons-round profile-avatar-icon">person</span>
                        <div 
                            style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: isEditing ? '#4ade80' : 'var(--neon-blue)', color: 'white', padding: '0.375rem', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '2px solid #050b14', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                            onClick={handleEditToggle}
                        >
                            <span className="material-icons-round" style={{ fontSize: '0.875rem' }}>{isEditing ? 'check' : 'edit'}</span>
                        </div>
                    </div>
                </div>
                 <div className="animate-slide-in" style={{ animationDelay: '0.1s', textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{formName || "Usuario"}</h2>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{userEmail}</p>
                 </div>

                <div className="animate-slide-in" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', animationDelay: '0.2s' }}>
                    <div className="flex justify-between items-center px-1">
                        <h3 className="section-title mb-0">Información Personal</h3>
                        {isEditing && <span className="text-xs text-green-400 font-medium animate-pulse">Editando...</span>}
                    </div>
                    
                    <div className="premium-card" style={{ borderRadius: '1rem', overflow: 'hidden', border: isEditing ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="material-icons-round" style={{ color: isEditing ? '#4ade80' : '#6b7280' }}>badge</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.625rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Nombre / Empresa</label>
                                <input 
                                    style={{ background: 'transparent', border: 'none', padding: '0.25rem 0 0 0', width: '100%', fontSize: '0.875rem', color: '#e5e7eb', outline: 'none', borderBottom: isEditing ? '1px solid #4ade80' : 'none' }} 
                                    type="text" 
                                    value={formName} 
                                    onChange={(e) => setFormName(e.target.value)}
                                    readOnly={!isEditing} 
                                />
                            </div>
                        </div>
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="material-icons-round" style={{ color: isEditing ? '#4ade80' : '#6b7280' }}>phone</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.625rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Teléfono</label>
                                <input 
                                    style={{ background: 'transparent', border: 'none', padding: '0.25rem 0 0 0', width: '100%', fontSize: '0.875rem', color: '#e5e7eb', outline: 'none', borderBottom: isEditing ? '1px solid #4ade80' : 'none' }} 
                                    type="tel" 
                                    value={formPhone} 
                                    onChange={(e) => setFormPhone(e.target.value)}
                                    readOnly={!isEditing} 
                                />
                            </div>
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="material-icons-round" style={{ color: isEditing ? '#4ade80' : '#6b7280' }}>business</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.625rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Departamento / Giro</label>
                                <input 
                                    style={{ background: 'transparent', border: 'none', padding: '0.25rem 0 0 0', width: '100%', fontSize: '0.875rem', color: '#e5e7eb', outline: 'none', borderBottom: isEditing ? '1px solid #4ade80' : 'none' }} 
                                    type="text" 
                                    value={formCompany} 
                                    onChange={(e) => setFormCompany(e.target.value)}
                                    readOnly={!isEditing} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="animate-slide-in" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', animationDelay: '0.3s' }}>
                    <h3 className="section-title">Configuración</h3>
                    <div className="premium-card" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                        <button 
                            onClick={toggleNotifications}
                            style={{ width: '100%', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#050b14', color: '#6b7280', display: 'flex' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1.125rem' }}>notifications</span>
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e5e7eb' }}>Notificaciones</span>
                            </div>
                            <div style={{ 
                                width: '2.5rem', 
                                height: '1.5rem', 
                                backgroundColor: notificationsEnabled ? 'var(--neon-blue)' : '#374151', 
                                borderRadius: '9999px', 
                                position: 'relative', 
                                transition: 'background-color 0.3s'
                            }}>
                                <div style={{ 
                                    position: 'absolute', 
                                    right: notificationsEnabled ? '0.25rem' : 'auto', 
                                    left: notificationsEnabled ? 'auto' : '0.25rem',
                                    top: '0.25rem', 
                                    width: '1rem', 
                                    height: '1rem', 
                                    backgroundColor: 'white', 
                                    borderRadius: '50%',
                                    transition: 'all 0.3s' 
                                }}></div>
                            </div>
                        </button>
                        <button 
                            onClick={() => setSecurityEnabled(!securityEnabled)}
                            style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#050b14', color: '#6b7280', display: 'flex' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1.125rem' }}>lock</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e5e7eb' }}>Biometría / FaceID</span>
                                    <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>Acceso rápido</span>
                                </div>
                            </div>
                            <div style={{ 
                                width: '2.5rem', 
                                height: '1.5rem', 
                                backgroundColor: securityEnabled ? 'var(--neon-blue)' : '#374151', 
                                borderRadius: '9999px', 
                                position: 'relative', 
                                transition: 'background-color 0.3s'
                            }}>
                                <div style={{ 
                                    position: 'absolute', 
                                    right: securityEnabled ? '0.25rem' : 'auto', 
                                    left: securityEnabled ? 'auto' : '0.25rem',
                                    top: '0.25rem', 
                                    width: '1rem', 
                                    height: '1rem', 
                                    backgroundColor: 'white', 
                                    borderRadius: '50%',
                                    transition: 'all 0.3s' 
                                }}></div>
                            </div>
                        </button>
                    </div>
                </div>

                <div style={{ paddingTop: '1rem', marginTop: 'auto' }}>
                    <button 
                        onClick={handleLogout}
                        style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(127, 29, 29, 0.3)', backgroundColor: 'rgba(127, 29, 29, 0.1)', color: '#f87171', fontWeight: 500, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                        <span className="material-icons-round">logout</span>
                        Cerrar Sesión
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.625rem', color: '#4b5563', marginTop: '1rem' }}>MTZ Ouroborus AI v2.0.4 • MTZ Corp</p>
                </div>
            </div>
        </div>
    );
};

export default MobileProfile;
