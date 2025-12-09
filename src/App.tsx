import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { sessionCache } from './lib/sessionCache'
import Auth from './components/Auth'
import ChatInterface from './components/ChatInterface'
import AdminPanel from './components/AdminPanel'
import InvitadoWelcome from './components/InvitadoWelcome'
import DevModeSelector from './components/DevModeSelector'
import './App.css'
import type { UserRole, UserType } from './types'

interface User {
  id: string
  email: string
  role: UserRole
  user_type?: 'invitado' | 'cliente_nuevo' | 'cliente_existente' | 'inclusion'
}

function App() {
  // Intentar cargar desde caché INMEDIATAMENTE antes de cualquier estado
  const cachedUser = sessionCache.get()
  const initialUser = cachedUser && cachedUser.id && sessionCache.isValid() 
    ? {
        id: cachedUser.id,
        email: cachedUser.email,
        role: cachedUser.role as UserRole,
        user_type: cachedUser.user_type as any
      }
    : null

  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser) // Si hay caché, no cargar
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showGuestWelcome, setShowGuestWelcome] = useState(false)
  const [devMode, setDevMode] = useState(false) // Modo de desarrollo
  const isDev = import.meta.env.DEV // Detecta si estamos en desarrollo
  
  // Refs para evitar recargas innecesarias
  const isLoadingRef = useRef(false)
  const lastCheckRef = useRef<number>(initialUser ? Date.now() : 0)
  // const sessionCheckedRef = useRef(!!initialUser) // No utilizado actualmente
  const userRef = useRef<User | null>(initialUser) // Ref para acceder al usuario actual

  // Actualizar ref cuando cambia el usuario
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    let mounted = true
    let loadingTimeout: NodeJS.Timeout | null = null

    // Si ya hay usuario desde caché, NO hacer nada más
    if (initialUser) {
      console.log('Usuario ya cargado desde caché inicial, omitiendo verificación:', initialUser.email)
      // Configurar estados según el usuario
      if (initialUser.role === 'admin') {
        setShowAdminPanel(true)
        setShowGuestWelcome(false)
      } else {
        setShowAdminPanel(false)
        setShowGuestWelcome(initialUser.user_type === 'invitado')
      }
      return
    }

    // Timeout de seguridad
    const forceStopLoading = () => {
      if (mounted && isLoadingRef.current) {
        console.warn('Timeout: Forzando detención de carga')
        isLoadingRef.current = false
        setLoading(false)
      }
    }

    // Timeout de 5 segundos
    loadingTimeout = setTimeout(forceStopLoading, 5000)

    // Verificar sesión actual
    checkUser().finally(() => {
      if (mounted && loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
    })

    // Listener de visibilidad COMPLETAMENTE DESHABILITADO
    // NO hacer NADA al cambiar de pestaña - confiar completamente en el caché
    // const handleVisibilityChange = () => { // No utilizado actualmente
    //   // NO HACER NADA - completamente deshabilitado
    //   return
    // }

    // NO agregar el listener - está completamente deshabilitado
    // document.addEventListener('visibilitychange', handleVisibilityChange)

    // Escuchar cambios de autenticación - SOLO eventos críticos, ignorar todo lo demás
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        // IGNORAR TODOS los eventos excepto SIGNED_IN y SIGNED_OUT
        // TOKEN_REFRESHED, USER_UPDATED, etc. NO deben causar recargas
        if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') {
          console.log('Evento ignorado (no causa recarga):', event)
          return
        }
        
        // Si ya hay usuario cargado y caché válido, IGNORAR incluso SIGNED_IN
        const currentUser = userRef.current
        if (event === 'SIGNED_IN' && currentUser && sessionCache.isValid()) {
          console.log('Usuario ya cargado con caché válido, ignorando SIGNED_IN')
          return
        }
        
        console.log('Auth state changed (evento crítico):', event, session?.user?.email)
        
        // Solo procesar SIGNED_IN y SIGNED_OUT
        if (event === 'SIGNED_IN' && session?.user) {
          // Solo cargar si NO hay usuario actual o es diferente
          const currentUser = userRef.current
          if (!currentUser || currentUser.id !== session.user.id) {
            if (!isLoadingRef.current) {
              isLoadingRef.current = true
              setLoading(true)
            }
            try {
              await loadUserProfile(session.user.id)
            } catch (error) {
              console.error('Error en loadUserProfile desde onAuthStateChange:', error)
              setLoading(false)
              isLoadingRef.current = false
            }
          } else {
            console.log('Usuario ya cargado, omitiendo recarga')
          }
        } else if (event === 'SIGNED_OUT') {
          sessionCache.clear()
          setUser(null)
          userRef.current = null
          setLoading(false)
          isLoadingRef.current = false
        }
      }
    )

    return () => {
      mounted = false
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
      // No hay listener que remover ya que está deshabilitado
      subscription.unsubscribe()
    }
  }, []) // IMPORTANTE: Array vacío - solo se ejecuta una vez al montar

  // Efecto separado para manejar cambios en el usuario sin recargar
  useEffect(() => {
    if (user && user.id) {
      // Actualizar caché cuando el usuario cambia
      sessionCache.set({
        id: user.id,
        email: user.email,
        role: user.role,
        user_type: user.user_type
      })
      lastCheckRef.current = Date.now()
    }
  }, [user?.id]) // Solo actualizar caché cuando cambia el ID del usuario

  // Función para recargar después del login
  const handleAuthSuccess = async () => {
    setLoading(true)
    try {
      await checkUser()
    } catch (error) {
      console.error('Error en handleAuthSuccess:', error)
      setLoading(false)
    }
  }

  const checkUser = async () => {
    // Evitar múltiples verificaciones simultáneas
    if (isLoadingRef.current) {
      console.log('Ya hay una verificación en curso, omitiendo...')
      return
    }

    // Si hay usuario cargado y caché válido, NO verificar
    if (user && sessionCache.isValid()) {
      console.log('Usuario cargado y caché válido, omitiendo verificación')
      return
    }

    try {
      isLoadingRef.current = true
      lastCheckRef.current = Date.now()
      
      console.log('Verificando sesión...')
      
      // Timeout para getSession (más largo para evitar falsos negativos)
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      )
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any
      
      if (error) {
        console.error('Error al obtener sesión:', error)
        // Si hay error pero hay usuario en caché, mantenerlo
        const cachedUser = sessionCache.get()
        if (cachedUser && sessionCache.isValid()) {
          console.log('Manteniendo usuario desde caché después de error')
          isLoadingRef.current = false
          return
        }
        setLoading(false)
        setUser(null)
        isLoadingRef.current = false
        return
      }
      
      console.log('Sesión obtenida:', session ? 'Sí' : 'No')
      if (session?.user) {
        // Solo cargar si el usuario es diferente al actual
        if (!user || user.id !== session.user.id) {
          console.log('Usuario encontrado:', session.user.email)
          await loadUserProfile(session.user.id)
        } else {
          console.log('Usuario ya cargado, omitiendo recarga')
          isLoadingRef.current = false
          setLoading(false)
        }
      } else {
        console.log('No hay sesión activa')
        sessionCache.clear()
        setLoading(false)
        setUser(null)
        isLoadingRef.current = false
      }
    } catch (error: any) {
      console.error('Error al verificar sesión:', error)
      // Si hay error pero hay usuario en caché, mantenerlo
      const cachedUser = sessionCache.get()
      if (cachedUser && sessionCache.isValid()) {
        console.log('Manteniendo usuario desde caché después de timeout')
        isLoadingRef.current = false
        return
      }
      setLoading(false)
      setUser(null)
      isLoadingRef.current = false
    }
  }

  const loadUserProfile = async (userId: string) => {
    let loadingStopped = false
    
    // Función helper para asegurar que loading se detenga
    const stopLoading = () => {
      if (!loadingStopped) {
        loadingStopped = true
        isLoadingRef.current = false
        setLoading(false)
      }
    }

    try {
      console.log('Cargando perfil para usuario:', userId)
      
      // Obtener información del usuario autenticado con timeout más largo
      let authUser
      try {
        const getUserPromise = supabase.auth.getUser()
        const getUserTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getUser timeout')), 5000) // Aumentado a 5 segundos
        )
        
        const result = await Promise.race([getUserPromise, getUserTimeout]) as any
        if (result.error || !result.data?.user) {
          throw new Error('No se pudo obtener usuario')
        }
        authUser = result.data.user
      } catch (error: any) {
        console.error('Error al obtener usuario:', error)
        // Si hay usuario en caché, usarlo
        const cachedUser = sessionCache.get()
        if (cachedUser && cachedUser.id === userId) {
          console.log('Usando usuario desde caché después de error getUser')
          setUser({
            id: cachedUser.id,
            email: cachedUser.email,
            role: cachedUser.role as UserRole,
            user_type: cachedUser.user_type as any
          })
          stopLoading()
          return
        }
        // Fallback: usar userId directamente
        // const isAdmin = false // No utilizado actualmente
        setUser({
          id: userId,
          email: '',
          role: 'invitado',
          user_type: 'invitado'
        })
        setShowGuestWelcome(true)
        stopLoading()
        return
      }

      const userEmail = authUser.email || ''
      const isAdmin = userEmail === 'mtzcontabilidad@gmail.com'

      // Intentar obtener el perfil (con timeout más corto)
      let profileData = null
      try {
        const profilePromise = supabase
          .from('user_profiles')
          .select('id, email, role, user_type')
          .eq('id', userId)
          .maybeSingle()

        // Timeout de 2 segundos para la consulta (más agresivo)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile timeout')), 2000)
        )

        const result = await Promise.race([profilePromise, timeoutPromise]) as any
        
        // Verificar si hay error (pero no es "no encontrado")
        if (result.error && result.error.code !== 'PGRST116') {
          throw result.error
        }
        
        profileData = result.data
      } catch (error: any) {
        // Si no existe el perfil o hay timeout, usar datos básicos
        if (error.code === 'PGRST116' || 
            error.message === 'Profile timeout' || 
            error.message?.includes('timeout') ||
            error.message === 'Timeout') {
          console.log('Perfil no encontrado o timeout, usando datos básicos')
          // Usar datos del auth directamente
          setUser({
            id: userId,
            email: userEmail,
            role: isAdmin ? 'admin' : 'invitado',
            user_type: 'invitado'
          })
          // LÓGICA: Admin va directo al Panel Admin, usuarios normales a InvitadoWelcome
          if (isAdmin) {
            setShowAdminPanel(true)
            setShowGuestWelcome(false) // Admin NUNCA ve InvitadoWelcome
          } else {
            setShowAdminPanel(false)
            setShowGuestWelcome(true)
          }
          stopLoading()
          
          // Intentar crear perfil en background (no bloquea)
          Promise.resolve(supabase
            .from('user_profiles')
            .insert({
              id: userId,
              email: userEmail,
              full_name: authUser.user_metadata?.full_name || userEmail.split('@')[0] || '',
              avatar_url: authUser.user_metadata?.avatar_url || null,
              role: isAdmin ? 'admin' : 'invitado',
              user_type: 'invitado'
            }))
            .then(() => console.log('Perfil creado en background'))
            .catch((err: unknown) => console.log('Error al crear perfil en background:', err))
          
          return
        }
        // Si es otro error, continuar con el flujo normal
        console.warn('Error al obtener perfil, usando fallback:', error)
      }

      // Si encontramos el perfil, usarlo
      if (profileData) {
        const userRole = profileData.role as UserRole
        const userType = profileData.user_type || 'invitado'
        const userData: User = {
          id: profileData.id,
          email: profileData.email,
          role: userRole,
          user_type: userType
        }
        
        setUser(userData)
        
        // Guardar en caché
        sessionCache.set({
          id: userData.id,
          email: userData.email,
          role: userData.role,
          user_type: userData.user_type
        })
        
        // LÓGICA DE NAVEGACIÓN:
        // - Si es ADMIN → Panel Admin por defecto (nunca ver InvitadoWelcome)
        // - Si es usuario normal e invitado → InvitadoWelcome
        // - Si es usuario normal y no invitado → Chat
        if (userRole === 'admin') {
          setShowAdminPanel(true) // Admin va directo al Panel Admin
          setShowGuestWelcome(false) // Admin NUNCA ve InvitadoWelcome
        } else {
          setShowAdminPanel(false)
          // Solo usuarios normales que son invitados ven la bienvenida
          setShowGuestWelcome(userType === 'invitado')
        }
      } else {
        // No tiene perfil (usuario nuevo)
        const userData: User = {
          id: userId,
          email: userEmail,
          role: isAdmin ? 'admin' : 'invitado',
          user_type: 'invitado'
        }
        
        setUser(userData)
        userRef.current = userData // Actualizar ref
        
        // Guardar en caché
        sessionCache.set({
          id: userData.id,
          email: userData.email,
          role: userData.role,
          user_type: userData.user_type
        })
        
        // LÓGICA: Si es admin sin perfil, crear perfil y mostrar Panel Admin
        // Si es usuario normal sin perfil, mostrar InvitadoWelcome
        if (isAdmin) {
          setShowAdminPanel(true) // Admin va directo al Panel Admin
          setShowGuestWelcome(false) // Admin NUNCA ve InvitadoWelcome
        } else {
          setShowAdminPanel(false)
          setShowGuestWelcome(true) // Usuario nuevo ve InvitadoWelcome
        }
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error)
      // Fallback: intentar obtener datos básicos del auth
      try {
        const { data: { user: fallbackUser } } = await supabase.auth.getUser()
        if (fallbackUser) {
          const isAdmin = fallbackUser.email === 'mtzcontabilidad@gmail.com'
          setUser({
            id: fallbackUser.id,
            email: fallbackUser.email || '',
            role: isAdmin ? 'admin' : 'invitado',
            user_type: 'invitado'
          })
          // LÓGICA: Admin va directo al Panel Admin, usuarios normales a InvitadoWelcome
          if (isAdmin) {
            setShowAdminPanel(true)
            setShowGuestWelcome(false) // Admin NUNCA ve InvitadoWelcome
          } else {
            setShowAdminPanel(false)
            setShowGuestWelcome(true)
          }
        } else {
          setUser(null)
        }
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError)
        setUser(null)
      }
    } finally {
      // Asegurar que SIEMPRE se detenga la carga
      stopLoading()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    sessionCache.clear()
    setUser(null)
    userRef.current = null
    setShowAdminPanel(false)
    setShowGuestWelcome(false)
    isLoadingRef.current = false
    setDevMode(false) // Resetear modo dev al hacer logout
  }

  // Función para iniciar modo de desarrollo
  const handleDevModeSelect = (role: UserRole, userType?: UserType) => {
    const mockUser: User = {
      id: `dev-${role}-${Date.now()}`,
      email: `dev-${role}@test.local`,
      role: role,
      user_type: userType || (role === 'admin' ? undefined : 'invitado')
    }
    
    setUser(mockUser)
    setDevMode(true)
    setLoading(false)
    
    // Guardar en caché
    sessionCache.set({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      user_type: mockUser.user_type
    })
    
    // Configurar estados según el rol
    if (role === 'admin') {
      setShowAdminPanel(true)
      setShowGuestWelcome(false)
    } else {
      setShowAdminPanel(false)
      setShowGuestWelcome(userType === 'invitado')
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Iniciando sesión...</p>
          <p className="loading-subtitle">Por favor espera un momento</p>
          <button 
            onClick={() => {
              console.log('Usuario canceló carga, forzando detención')
              setLoading(false)
              setUser(null)
            }}
            className="cancel-loading-button"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    // En modo desarrollo, mostrar selector de roles
    if (isDev) {
      return <DevModeSelector onSelectRole={handleDevModeSelect} />
    }
    // En producción, mostrar autenticación normal
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  // Si es invitado y debe ver la bienvenida, mostrar sin header ni footer (pantalla completa)
  // IMPORTANTE: Los admins NUNCA ven esta página, incluso si tienen user_type = 'invitado'
  if (showGuestWelcome && user.user_type === 'invitado' && user.role !== 'admin') {
    return (
      <div className="app guest-welcome-mode">
        <div className="container guest-container">
          <div className="guest-header-minimal">
            <button onClick={handleLogout} className="logout-button-minimal">
              Salir
            </button>
          </div>
          <InvitadoWelcome 
            user={user} 
            onContinue={() => {
              setShowGuestWelcome(false)
              // Recargar perfil para verificar si cambió el tipo
              loadUserProfile(user.id)
            }} 
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`app ${showAdminPanel && user.role === 'admin' ? 'admin-mode' : ''}`}>
      <div className={`container ${showAdminPanel && user.role === 'admin' ? 'admin-container' : ''}`}>
        <header className="header">
          <div>
            <h1>
              MTZ Asistente
              {user.role === 'admin' && <span className="admin-badge">Admin</span>}
            </h1>
            <p>¿En qué puedo ayudarte hoy?</p>
          </div>
          <div className="header-actions">
            {user.role === 'admin' && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="admin-toggle-button"
              >
                {showAdminPanel ? 'Chat' : 'Panel Admin'}
              </button>
            )}
            <button onClick={handleLogout} className="logout-button">
              Salir
            </button>
          </div>
        </header>
        {showAdminPanel && user.role === 'admin' ? (
          <AdminPanel />
        ) : (
          <ChatInterface />
        )}
      </div>
    </div>
  )
}

export default App
