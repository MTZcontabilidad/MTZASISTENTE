import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserMeetings } from '../lib/meetings';
import { getClientDocuments } from '../lib/documents';
import { getWorkshopRequestsByUserId } from '../lib/wheelchairWorkshop';
import { getTransportRequestsByUserId } from '../lib/transportRequests';
import { getOrCreateClientInfo } from '../lib/clientInfo';
import { getClientExtendedInfo } from '../lib/clientExtendedInfo';
import type { UserProfile, Meeting, ClientDocument, ClientInfo, ClientExtendedInfo } from '../types';
import './ClientSidebar.css';

export type ClientTab = 'chat' | 'meetings' | 'documents' | 'company' | 'requests' | 'notes' | 'profile';

interface ClientSidebarProps {
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  userId: string;
  userRole: 'cliente' | 'inclusion';
  onClose?: () => void;
}

interface ClientSidebarState {
  meetings: Meeting[];
  documents: ClientDocument[];
  wheelchairRequests: any[];
  transportRequests: any[];
  clientInfo: ClientInfo | null;
  clientExtendedInfo: ClientExtendedInfo | null;
  loading: {
    meetings: boolean;
    documents: boolean;
    requests: boolean;
    company: boolean;
  };
}

export default function ClientSidebar({
  activeTab,
  onTabChange,
  userId,
  userRole,
  onClose,
}: ClientSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [state, setState] = useState<ClientSidebarState>({
    meetings: [],
    documents: [],
    wheelchairRequests: [],
    transportRequests: [],
    clientInfo: null,
    clientExtendedInfo: null,
    loading: {
      meetings: false,
      documents: false,
      requests: false,
      company: false,
    },
  });

  // Cargar datos según la pestaña activa
  useEffect(() => {
    if (activeTab === 'meetings') {
      loadMeetings();
    } else if (activeTab === 'documents') {
      loadDocuments();
    } else if (activeTab === 'requests') {
      loadRequests();
    } else if (activeTab === 'company') {
      loadCompanyInfo();
    }
  }, [activeTab, userId]);

  const loadMeetings = async () => {
    if (state.loading.meetings) return;
    setState(prev => ({ ...prev, loading: { ...prev.loading, meetings: true } }));
    try {
      const meetings = await getUserMeetings(userId);
      setState(prev => ({ ...prev, meetings, loading: { ...prev.loading, meetings: false } }));
    } catch (error) {
      console.error('Error al cargar reuniones:', error);
      setState(prev => ({ ...prev, loading: { ...prev.loading, meetings: false } }));
    }
  };

  const loadDocuments = async () => {
    if (state.loading.documents) return;
    setState(prev => ({ ...prev, loading: { ...prev.loading, documents: true } }));
    try {
      const documents = await getClientDocuments(userId);
      setState(prev => ({ ...prev, documents, loading: { ...prev.loading, documents: false } }));
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      setState(prev => ({ ...prev, loading: { ...prev.loading, documents: false } }));
    }
  };

  const loadRequests = async () => {
    if (state.loading.requests) return;
    setState(prev => ({ ...prev, loading: { ...prev.loading, requests: true } }));
    try {
      const [wheelchair, transport] = await Promise.all([
        getWorkshopRequestsByUserId(userId),
        userRole === 'inclusion' ? getTransportRequestsByUserId(userId) : Promise.resolve([]),
      ]);
      setState(prev => ({
        ...prev,
        wheelchairRequests: wheelchair,
        transportRequests: transport,
        loading: { ...prev.loading, requests: false },
      }));
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      setState(prev => ({ ...prev, loading: { ...prev.loading, requests: false } }));
    }
  };

  const loadCompanyInfo = async () => {
    if (state.loading.company) return;
    setState(prev => ({ ...prev, loading: { ...prev.loading, company: true } }));
    try {
      const [clientInfo, extendedInfo] = await Promise.all([
        getOrCreateClientInfo(userId),
        getClientExtendedInfo(userId),
      ]);
      setState(prev => ({
        ...prev,
        clientInfo,
        clientExtendedInfo: extendedInfo,
        loading: { ...prev.loading, company: false },
      }));
    } catch (error) {
      console.error('Error al cargar información de empresa:', error);
      setState(prev => ({ ...prev, loading: { ...prev.loading, company: false } }));
    }
  };

  const menuItems: Array<{ id: ClientTab; label: string; icon: string; showFor?: ('cliente' | 'inclusion')[] }> = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'meetings', label: 'Mis Reuniones', icon: '📅' },
    { id: 'documents', label: 'Mis Documentos', icon: '📄' },
    { id: 'company', label: 'Mi Empresa', icon: '🏢', showFor: ['cliente'] },
    { id: 'requests', label: 'Mis Solicitudes', icon: '🪑' },
    { id: 'notes', label: 'Notas', icon: '📝' },
    { id: 'profile', label: 'Mi Perfil', icon: '👤' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.showFor) return true;
    return item.showFor.includes(userRole);
  });

  return (
    <aside className={`client-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>Mi Panel</h2>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>
      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-menu-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
            title={sidebarOpen ? item.label : item.label}
          >
            <span className="menu-icon">{item.icon}</span>
            {sidebarOpen && <span className="menu-label">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}

