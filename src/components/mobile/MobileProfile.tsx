import React, { useEffect, useState } from 'react';
import './Mobile.css';
import { supabase } from '../../lib/supabase';

const MobileProfile: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>("");

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
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload(); // Simple reload to reset state/auth
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full text-white">Cargando perfil...</div>;
    }

    const displayName = profile?.preferred_name || profile?.full_name || "Usuario";
    const displayPhone = profile?.phone || "No registrado";
    const displayCompany = profile?.company_name || "No registrada";

    return (

        <div className="mobile-view-container">
            <header className="mobile-header">
                <button style={{ position: 'absolute', left: '1rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span className="material-icons-round" style={{ fontSize: '1.5rem' }}>arrow_back</span>
                </button>
                <h1 className="mobile-title">MTZ Ouroborus AI</h1>
                <p className="mobile-subtitle">Tu asistente virtual de MTZ</p>
            </header>

            <div className="mobile-scroll-content">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem', marginBottom: '1.5rem' }}>
                    <div className="profile-avatar-container">
                        <span className="material-icons-round profile-avatar-icon">person</span>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--neon-blue)', color: 'white', padding: '0.375rem', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '2px solid #050b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons-round" style={{ fontSize: '0.875rem' }}>edit</span>
                        </div>
                    </div>
                    <h2 style={{ marginTop: '1rem', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{displayName}</h2>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{userEmail}</p>
                </div>

                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 className="section-title">Información Personal</h3>
                    <div style={{ backgroundColor: '#111118', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="material-icons-round" style={{ color: '#6b7280' }}>badge</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.625rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Nombre / Empresa</label>
                                <input style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', fontSize: '0.875rem', color: '#e5e7eb', outline: 'none' }} type="text" value={displayName} readOnly />
                            </div>
                            <span className="material-icons-round" style={{ color: 'var(--neon-blue)', fontSize: '1.125rem' }}>edit</span>
                        </div>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="material-icons-round" style={{ color: '#6b7280' }}>phone</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.625rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Teléfono</label>
                                <input style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', fontSize: '0.875rem', color: '#e5e7eb', outline: 'none' }} type="tel" value={displayPhone} readOnly />
                            </div>
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="material-icons-round" style={{ color: '#6b7280' }}>business</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.625rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Departamento / Giro</label>
                                <input style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', fontSize: '0.875rem', color: '#e5e7eb', outline: 'none' }} type="text" value={profile?.business_line || displayCompany} readOnly />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 className="section-title">Configuración</h3>
                    <div style={{ backgroundColor: '#111118', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <button style={{ width: '100%', padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', borderBottomWidth: '1px', cursor: 'pointer', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#050b14', color: '#6b7280', display: 'flex' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1.125rem' }}>notifications</span>
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e5e7eb' }}>Notificaciones</span>
                            </div>
                            <div style={{ width: '2.5rem', height: '1.5rem', backgroundColor: 'var(--neon-blue)', borderRadius: '9999px', position: 'relative' }}>
                                <div style={{ position: 'absolute', right: '0.25rem', top: '0.25rem', width: '1rem', height: '1rem', backgroundColor: 'white', borderRadius: '50%' }}></div>
                            </div>
                        </button>
                        <button style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#050b14', color: '#6b7280', display: 'flex' }}>
                                    <span className="material-icons-round" style={{ fontSize: '1.125rem' }}>lock</span>
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e5e7eb' }}>Seguridad</span>
                            </div>
                            <span className="material-icons-round" style={{ color: '#6b7280', fontSize: '1.125rem' }}>chevron_right</span>
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
