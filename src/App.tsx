import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import ChatInterface from './components/ChatInterface'
import AdminPanel from './components/AdminPanel'
import InvitadoWelcome from './components/InvitadoWelcome'
import DevModeSelector from './components/DevModeSelector'
import MobileLayout from './components/mobile/MobileLayout'
import './App.css'
import type { UserRole, UserType } from './types'

function AppContent() {
  const { user, loading, isAdmin, devMode, setDevMode, refreshProfile, setUser } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showNormalAuth, setShowNormalAuth] = useState(false)
  const [welcomeCompleted, setWelcomeCompleted] = useState(() => localStorage.getItem('mtz_welcome_completed') === 'true')

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Loading View
  // Loading View with Safety Timeout
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    if (loading) {
        const timer = setTimeout(() => setShowReset(true), 5000); // Show reset after 5s
        return () => clearTimeout(timer);
    } else {
        setShowReset(false);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema...</p>
        </div>
        
        {showReset && (
            <div className="animate-fade-in p-4 bg-white rounded-lg shadow-md max-w-sm text-center">
                <p className="text-sm text-gray-500 mb-3">
                    Estás tardando más de lo normal. ¿Problemas de caché?
                </p>
                <button 
                    onClick={() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.reload();
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium transition-colors"
                >
                    Reiniciar Sistema y Limpiar Caché
                </button>
            </div>
        )}
      </div>
    )
  }

  // 1. No User - Show Auth or Dev Selector
  if (!user && !devMode) {
      if (import.meta.env.DEV && !showNormalAuth) {
          return (
            <DevModeSelector 
                onSelectRole={(role: UserRole, userType?: UserType) => {
                    const devUser = {
                        id: role === 'admin' ? 'dev-admin' : 'dev-user',
                        email: role === 'admin' ? 'admin@dev.local' : 'dev@local.com',
                        role: role,
                        user_type: userType || 'invitado'
                    };
                    
                    setUser(devUser);
                    localStorage.setItem('MTZ_DEBUG_USER', JSON.stringify(devUser)); // Sync with useChat
                    setDevMode(true);
                }}
                onStartNormalAuth={() => setShowNormalAuth(true)}
            />
          )
      }
      return <Auth onAuthSuccess={() => refreshProfile()} />
  }

  // Mobile View
  if (isMobile) {
    return <MobileLayout user={user} />
  }

  // Admin View
  if (isAdmin) {
    return <AdminPanel />
  }

  // 2. User Logged In - Check for Welcome Screen
  // Mostrar InvitadoWelcome si es un invitado y no ha completado el welcome (y no está en modo dev que lo salta)
  if (user && user.user_type === 'invitado' && !welcomeCompleted && !devMode) {
      // Necesitamos el objeto user completo para InvitadoWelcome
      // El contexto devuelve un User que es compatible con InvitadoWelcomeProps['user']
      return (
          <InvitadoWelcome 
              user={user} 
              onContinue={async () => {
                  localStorage.setItem('mtz_welcome_completed', 'true');
                  setWelcomeCompleted(true);
                  await refreshProfile();
              }} 
          />
      )
  }

  // 3. Main App (Chat)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Main App Layout */}
       {isAdmin ? (
         <AdminPanel />
       ) : (
         <ChatInterface />
       )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
