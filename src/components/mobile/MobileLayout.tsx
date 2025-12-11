import React, { useState } from 'react';
import './Mobile.css';
import MobileChat from './MobileChat';
import MobileAccess from './MobileAccess';
import MobileMeetings from './MobileMeetings';
import MobileDocs from './MobileDocs';
import MobileProfile from './MobileProfile';

type Tab = 'chat' | 'accesses' | 'meetings' | 'docs' | 'profile';

const MobileLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('chat');

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
                    className={`nav-item ${activeTab === 'accesses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('accesses')}
                >
                    <span className="material-icons-round">rocket_launch</span>
                    <span className="nav-label">Accesos</span>
                </button>
                
                <button 
                    className={`nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('meetings')}
                >
                    <span className="material-icons-round">event</span>
                    <span className="nav-label">Reuniones</span>
                </button>
                
                <button 
                    className={`nav-item ${activeTab === 'docs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('docs')}
                >
                    <span className="material-icons-round">description</span>
                    <span className="nav-label">Docs</span>
                </button>
                
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
