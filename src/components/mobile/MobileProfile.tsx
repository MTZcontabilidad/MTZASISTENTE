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
        return (
            <div className="mobile-view-container system-bg-void">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
            <div className="mobile-view-container system-bg-void">
                 {toastMessage && (
                    <div className="toast-notification info">
                        {toastMessage}
                    </div>
                )}

                <header className="glass-header">
                     <h1>Perfil</h1>
                     <p>Datos de Usuario</p>
                </header>

                <div className="mobile-content-scroll" style={{ padding: '1.5rem 1rem 6rem 1rem' }}>
                    
                    {/* AVATAR SECTION */}
                    <div className="profile-avatar-section">
                        <div className="avatar-wrapper">
                             <span className="material-icons-round" style={{ fontSize: '3rem', color: 'var(--mobile-text-muted)' }}>person</span>
                             <button 
                                className="avatar-edit-btn"
                                onClick={handleEditToggle}
                            >
                                <span className="material-icons-round" style={{ fontSize: '0.875rem' }}>{isEditing ? 'check' : 'edit'}</span>
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label className="section-label">Nombre Completo</label>
                                    <input 
                                        className="system-input"
                                        value={formName} 
                                        onChange={(e) => setFormName(e.target.value)}
                                        readOnly={!isEditing} 
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                
                                {/* Phone */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label className="section-label">Teléfono</label>
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label className="section-label">Empresa</label>
                                    <input 
                                        className="system-input"
                                        value={formCompany} 
                                        onChange={(e) => setFormCompany(e.target.value)}
                                        readOnly={!isEditing} 
                                        placeholder="Nombre Empresa"
                                    />
                                </div>

                                 {/* Giro */}
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label className="section-label">Giro / Actividad</label>
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



                        {/* MULTI-EMPRESA SECTION (NEW) */}
                        <CompaniesSection userId={profile?.id} />

                        {/* SETTINGS */}
                        <div className="mb-6">
                             {/* ... existing settings if any, else this block is placeholder for future settings ... */}
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
                            <p style={{ 
                                textAlign: 'center', 
                                fontSize: '0.65rem', 
                                color: 'var(--mobile-text-muted)', 
                                marginTop: '1.5rem',
                                fontFamily: 'monospace',
                                opacity: 0.6
                            }}>
                                MTZ Ouroborus AI v2.1.0-MC
                            </p>
                        </div>
                    </div>
                </div>
            </div>
    );
};

// Sub-component for Companies
const CompaniesSection: React.FC<{ userId: string }> = ({ userId }) => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
    const [taxSummaries, setTaxSummaries] = useState<any[]>([]);

    useEffect(() => {
        if (!userId) return;
        const fetchCompanies = async () => {
            // Join company_users with companies
            const { data, error } = await supabase
                .from('company_users')
                .select('role, companies(*)')
                .eq('user_id', userId);
            
            if (data) {
                // Flatten structure
                const flatList = data.map((item: any) => ({
                    ...item.companies,
                    user_role: item.role
                }));
                setCompanies(flatList);
            }
        };
        fetchCompanies();
    }, [userId]);

    const handleCompanyClick = async (company: any) => {
        setSelectedCompany(company);
        // Fetch Tax Summaries
        const { data } = await supabase
            .from('monthly_tax_summaries')
            .select('*')
            .eq('company_id', company.id)
            .order('period', { ascending: false });
        setTaxSummaries(data || []);
    };

    if (companies.length === 0) return null;

    return (
        <div className="mb-6">
            <span className="section-label">Mis Empresas</span>
            <div className="system-list-container">
                {companies.map(comp => (
                    <button 
                        key={comp.id}
                        className="system-list-item"
                        style={{ width: '100%' }}
                        onClick={() => handleCompanyClick(comp)}
                    >
                         <div className="avatar-wrapper" style={{ 
                            width: '2.5rem', 
                            height: '2.5rem',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            background: 'rgba(16, 185, 129, 0.1)'
                        }}>
                            <span className="material-icons-round" style={{ fontSize: '1.25rem', color: '#10b981' }}>business</span>
                        </div>
                        <div className="item-info" style={{ textAlign: 'left' }}>
                            <div className="item-title">{comp.razon_social}</div>
                            <div className="item-email">{comp.rut}</div>
                        </div>
                        <span className="material-icons-round" style={{ color: 'var(--mobile-text-muted)' }}>chevron_right</span>
                    </button>
                ))}
            </div>

            {/* Company Detail Modal */}
            {selectedCompany && (
                <div className="modal-overlay bottom-sheet" onClick={() => setSelectedCompany(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                                    {selectedCompany.razon_social}
                                </h3>
                                <div style={{ fontSize: '0.85rem', color: '#10b981', fontFamily: 'monospace' }}>
                                    {selectedCompany.rut}
                                </div>
                            </div>
                            <button onClick={() => setSelectedCompany(null)} className="icon-btn-secondary">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                         {/* Actions */}
                         {selectedCompany.drive_folder_url && (
                             <a 
                                href={selectedCompany.drive_folder_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn-primary"
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '0.5rem',
                                    marginBottom: '2rem',
                                    background: '#3b82f6',
                                    borderColor: '#2563eb'
                                }}
                            >
                                <span className="material-icons-round">folder_open</span>
                                Ver Documentos en Drive
                                <span className="material-icons-round" style={{ fontSize: '1rem' }}>open_in_new</span>
                            </a>
                        )}

                        <h4 className="section-label" style={{ marginBottom: '1rem' }}>Resumen F29 (Últimos Meses)</h4>
                        
                        {taxSummaries.length === 0 ? (
                            <div className="empty-state-mobile">
                                <p className="empty-subtitle">No hay información tributaria cargada.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {taxSummaries.map(summary => (
                                    <div key={summary.id} className="highlight-card" style={{ padding: '0.75rem', minHeight: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, color: '#fff' }}>
                                                {new Date(summary.period).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }).toUpperCase()}
                                            </span>
                                            <span className={`status-badge ${summary.estado_f29 === 'pagado' ? 'success' : 'warning'}`}>
                                                {summary.estado_f29?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--mobile-text-muted)', fontSize: '0.7rem' }}>VENTAS NETO</div>
                                                <div style={{ color: '#fff', fontFamily: 'monospace' }}>${summary.total_ventas_neto?.toLocaleString('es-CL')}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: 'var(--mobile-text-muted)', fontSize: '0.7rem' }}>COMPRAS NETO</div>
                                                <div style={{ color: '#fff', fontFamily: 'monospace' }}>${summary.total_compras_neto?.toLocaleString('es-CL')}</div>
                                            </div>
                                            <div style={{ gridColumn: 'span 2', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.9rem' }}>IVA A PAGAR: </span>
                                                    <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>${summary.iva_pagar?.toLocaleString('es-CL')}</span>
                                                </div>
                                                
                                                {summary.f29_url && (
                                                    <a 
                                                        href={summary.f29_url} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="icon-btn-secondary"
                                                        style={{ 
                                                            width: '2rem', 
                                                            height: '2rem', 
                                                            background: 'rgba(59, 130, 246, 0.2)', 
                                                            color: '#60a5fa',
                                                            border: '1px solid rgba(59, 130, 246, 0.4)',
                                                            borderRadius: '0.375rem',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            textDecoration: 'none'
                                                        }}
                                                        title="Descargar F29"
                                                    >
                                                        <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>description</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div style={{ height: '2rem' }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default MobileProfile;
