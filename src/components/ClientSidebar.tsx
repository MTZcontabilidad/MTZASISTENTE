import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserMeetings } from '../lib/meetings';
import { getClientDocuments } from '../lib/documents';
import { getOrCreateClientInfo } from '../lib/clientInfo';
import { getClientExtendedInfo } from '../lib/clientExtendedInfo';
import type { UserProfile, Meeting, ClientInfo, ClientExtendedInfo } from '../types';
import type { ClientDocument } from '../lib/documents';
import './ClientSidebar.css';

export type ClientTab = 'chat' | 'meetings' | 'documents' | 'company' | 'requests' | 'notes' | 'profile' | 'services' | 'mtz-consultores' | 'abuelita-alejandra';

interface ClientSidebarProps {
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  userId: string;
  userRole: 'cliente' | 'invitado'; // Removed inclusion
  onClose?: () => void;
}

interface ClientSidebarState {
  meetings: Meeting[];
  documents: ClientDocument[];
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

  // Menú para invitados (servicios de MTZ)
  const invitadoMenuItems: Array<{ id: ClientTab; label: string; icon: string; showFor?: ('cliente')[] }> = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'services', label: 'Accesos Rápidos', icon: '🚀' },
    { id: 'mtz-consultores', label: 'MTZ Consultores Tributarios', icon: '📊' },
    { id: 'abuelita-alejandra', label: 'Fábrica de Ropa y Diseño Abuelita Alejandra', icon: '👗' },
    { id: 'profile', label: 'Mi Perfil', icon: '👤' },
  ];

  // Menú para clientes
  const clienteMenuItems: Array<{ id: ClientTab; label: string; icon: string; showFor?: ('cliente')[] }> = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'services', label: 'Accesos Rápidos', icon: '🚀' },
    { id: 'meetings', label: 'Mis Reuniones', icon: '📅' },
    { id: 'documents', label: 'Mis Documentos', icon: '📄' },
    { id: 'company', label: 'Mi Empresa', icon: '🏢' },
    { id: 'requests', label: 'Mis Solicitudes', icon: '🪑' }, // Keep generic requests if needed, but wheelchalr gone
    { id: 'notes', label: 'Notas', icon: '📝' },
    { id: 'profile', label: 'Mi Perfil', icon: '👤' },
  ];

  // Seleccionar el menú según el rol
  let menuItems: Array<{ id: ClientTab; label: string; icon: string; showFor?: ('cliente')[] }>;
  
  if (userRole === 'invitado') {
    menuItems = invitadoMenuItems;
  } else {
    menuItems = clienteMenuItems;
  }

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.showFor) return true;
    return item.showFor.includes(userRole as 'cliente');
  });

  return (
    <aside className={`client-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>{userRole === 'invitado' ? 'Servicios MTZ' : 'Mi Panel'}</h2>
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

