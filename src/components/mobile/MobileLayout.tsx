import React, { useState, useEffect } from 'react';
import './Mobile.css';
import MobileChat from './MobileChat';
import MobileAccess from './MobileAccess';
import MobileMeetings from './MobileMeetings';
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
                return <MobileMeetings />;
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
        <div className="mobile-layout">
            {renderContent()}
            
            <nav className="mobile-nav">
                <button 
                    className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                >
                    <span className="material-icons-round">chat_bubble_outline</span>
                    <span className="nav-label">Chat</span>
                </button>
                
                <button 
                    className={`nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('meetings')}
                >
                    <span className="material-icons-round">event</span>
                    <span className="nav-label">Reuniones</span>
                </button>
                
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
                
                {/* 
                <button 
                    className={`nav-item ${activeTab === 'docs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('docs')}
                >
                    <span className="material-icons-round">description</span>
                    <span className="nav-label">Docs</span>
                </button> 
                */}
                {/* Keeping 5 items max for better spacing. Replacing Docs with Accesses/Admin for now or just squeezing them in? 
                    Let's just keep Docs for everyone and swap Accesses for Admin if needed, or just add Admin.
                    Mobile navs usually handle 5 items max well.
                    Let's do: Chat | Meetings | Admin/Access | Docs | Profile
                */}

                 {!isAdmin && (
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
