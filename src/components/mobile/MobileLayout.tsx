import React, { useState, useEffect } from 'react';
import './Mobile.css';
import MobileChat from './MobileChat';
import MobileAccess from './MobileAccess';
import MobileTasks from './MobileTasks';
import MobileDocs from './MobileDocs';
import MobileProfile from './MobileProfile';
import MobileAdmin from './MobileAdmin';

type Tab = 'chat' | 'accesses' | 'meetings' | 'docs' | 'profile' | 'admin';

interface MobileLayoutProps {
    user?: any; // Accepting user prop to check role
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const saved = sessionStorage.getItem('mobile_active_tab');
        return (saved as Tab) || 'chat';
    });
    const isAdmin = user?.role === 'admin';
    const isGuest = user?.role === 'invitado';

    useEffect(() => {
        sessionStorage.setItem('mobile_active_tab', activeTab);
    }, [activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'chat':
                return <MobileChat />;
            case 'accesses':
                return <MobileAccess />;
            case 'meetings':
                return <MobileTasks />;
            case 'docs':
                return <MobileDocs />;
            case 'profile':
                return <MobileProfile />;
            case 'admin':
                return <MobileAdmin />;
            default:
                return <MobileChat />;
        }
    };

    return (
        <div id="mobile-app-root" className="mobile-layout">
            {renderContent()}
            
            <nav className="mobile-nav">
                <button 
                    className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                >
                    <span className="material-icons-round">chat_bubble_outline</span>
                    <span className="nav-label">Chat</span>
                </button>
                
                {/* Meetings - Hide for Guests */}
                {!isGuest && (
                    <button 
                        className={`nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('meetings')}
                    >
                        <span className="material-icons-round">assignment</span>
                        <span className="nav-label">Pedidos</span>
                    </button>
                )}
                
                {isAdmin ? (
                     <button 
                        className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('admin')}
                    >
                        <span className="material-icons-round">admin_panel_settings</span>
                        <span className="nav-label">Admin</span>
                    </button>
                ) : (
                    <button 
                        className={`nav-item ${activeTab === 'accesses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('accesses')}
                    >
                        <span className="material-icons-round">rocket_launch</span>
                        <span className="nav-label">Accesos</span>
                    </button>
                )}
                
                 {/* Docs - Hide for Guests and Admins (Admins have their own module) */}
                 {!isAdmin && !isGuest && (
                    <button 
                        className={`nav-item ${activeTab === 'docs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('docs')}
                    >
                        <span className="material-icons-round">description</span>
                        <span className="nav-label">Docs</span>
                    </button>
                 )}
                 
                 {isAdmin && (
                     <button 
                        className={`nav-item ${activeTab === 'accesses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('accesses')}
                    >
                        <span className="material-icons-round">rocket_launch</span>
                        <span className="nav-label">Accesos</span>
                    </button>
                 )}
                
                <button 
                    className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <span className="material-icons-round">person</span>
                    <span className="nav-label">Perfil</span>
                </button>
            </nav>
        </div>
    );
};

export default MobileLayout;
