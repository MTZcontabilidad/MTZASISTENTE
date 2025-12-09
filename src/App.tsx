import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [showAdminPanel, setShowAdminPanel] = useState(initialUser?.role === 'admin' ? true : false)
  const [showGuestWelcome, setShowGuestWelcome] = useState(false)
  const [welcomeCompleted, setWelcomeCompleted] = useState(false) // Bandera para evitar que se vuelva a mostrar
  const [devMode, setDevMode] = useState(false) // Modo de desarrollo
  const [showNormalAuth, setShowNormalAuth] = useState(false) // Mostrar Auth normal desde DevModeSelector
  const isDev = import.meta.env.DEV // Detecta si estamos en desarrollo
  
  // Refs para evitar recargas innecesarias
  const isLoadingRef = useRef(false)
  const lastCheckRef = useRef<number>(initialUser ? Date.now() : 0)
  // const sessionCheckedRef = useRef(!!initialUser) // No utilizado actualmente
  const userRef = useRef<User | null>(initialUser) // Ref para acceder al usuario actual
  const adminPanelInitializedRef = useRef(initialUser?.role === 'admin' ? true : false) // Ref para evitar resetear showAdminPanel después de la primera inicialización

  // Actualizar ref cuando cambia el usuario
  useEffect(() => {
    userRef.current = user
  }, [user])

  // loadUserProfile debe estar definido antes de checkUser
  const loadUserProfile = useCallback(async (userId: string) => {
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
          setTimeout(() => reject(new Error('getUser timeout')), 10000)
        )
        
        const result = await Promise.race([getUserPromise, getUserTimeout]) as any
        if (result.error || !result.data?.user) {
          throw new Error('No se pudo obtener usuario')
        }
        authUser = result.data.user
      } catch (error: any) {
        console.error('Error al obtener usuario:', error)
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
        setUser({
          id: userId,
          email: '',
          role: 'invitado',
          user_type: 'invitado'
        })
        // SIMPLIFICADO: Ya no mostramos welcome, vamos directo al chat
        setShowGuestWelcome(false)
        stopLoading()
        return
      }

      const userEmail = authUser.email || ''
      // Verificar si es admin desde el perfil, no hardcodeado
      let isAdmin = false
      
      // Intentar obtener el role desde el perfil
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()
        if (profile?.role === 'admin') {
          isAdmin = true
        }
      } catch {
        // Si falla, usar false
        isAdmin = false
      }

      // Intentar obtener el perfil
      let profileData = null
      try {
        const profilePromise = supabase
          .from('user_profiles')
          .select('id, email, role, user_type')
          .eq('id', userId)
          .maybeSingle()

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile timeout')), 5000)
          )

        const result = await Promise.race([profilePromise, timeoutPromise]) as any
        
        if (result.error && result.error.code !== 'PGRST116') {
          throw result.error
        }
        
        profileData = result.data
      } catch (error: any) {
        if (error.code === 'PGRST116' || 
            error.message === 'Profile timeout' || 
            error.message?.includes('timeout') ||
            error.message === 'Timeout') {
          console.log('Perfil no encontrado o timeout, usando datos básicos')
          setUser({
            id: userId,
            email: userEmail,
            role: isAdmin ? 'admin' : 'invitado',
            user_type: 'invitado'
          })
          // Solo inicializar showAdminPanel la primera vez
          if (!adminPanelInitializedRef.current) {
            if (isAdmin) {
              setShowAdminPanel(true) // Los admins van directo al panel
            } else {
              setShowAdminPanel(false)
            }
            adminPanelInitializedRef.current = true
          }
          setShowGuestWelcome(false)
          stopLoading()
          
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
        
        sessionCache.set({
          id: userData.id,
          email: userData.email,
          role: userData.role,
          user_type: userData.user_type
        })
        
        // Determinar si es admin desde el role del perfil
        isAdmin = userRole === 'admin'
        
        // Solo inicializar showAdminPanel la primera vez, no resetearlo si el usuario ya lo cambió
        if (!adminPanelInitializedRef.current) {
          if (userRole === 'admin') {
            setShowAdminPanel(true) // Los admins van directo al panel
          } else {
            setShowAdminPanel(false)
          }
          adminPanelInitializedRef.current = true
        }
        setShowGuestWelcome(false)
      } else {
        // Intentar obtener el role desde el perfil si existe
        let userRole: UserRole = 'invitado'
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle()
          if (profile?.role) {
            userRole = profile.role as UserRole
            isAdmin = userRole === 'admin'
          }
        } catch {
          // Si falla, usar role por defecto
        }
        
        const userData: User = {
          id: userId,
          email: userEmail,
          role: userRole,
          user_type: 'invitado'
        }
        
        setUser(userData)
        userRef.current = userData
        
        sessionCache.set({
          id: userData.id,
          email: userData.email,
          role: userData.role,
          user_type: userData.user_type
        })
        
        // Solo inicializar showAdminPanel la primera vez
        if (!adminPanelInitializedRef.current) {
          if (isAdmin) {
            setShowAdminPanel(true) // Los admins van directo al panel
          } else {
            setShowAdminPanel(false)
          }
          adminPanelInitializedRef.current = true
        }
        setShowGuestWelcome(false)
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error)
      try {
        const { data: { user: fallbackUser } } = await supabase.auth.getUser()
        if (fallbackUser) {
          // Verificar role desde perfil si existe
          let isAdmin = false
          try {
            const { data: fallbackProfile } = await supabase
              .from('user_profiles')
              .select('role')
              .eq('id', fallbackUser.id)
              .maybeSingle()
            isAdmin = fallbackProfile?.role === 'admin'
          } catch {
            // Si falla, usar false
            isAdmin = false
          }
          // Intentar obtener el role desde el perfil
          let fallbackRole: UserRole = 'invitado'
          try {
            const { data: fallbackProfile } = await supabase
              .from('user_profiles')
              .select('role')
              .eq('id', fallbackUser.id)
              .maybeSingle()
            if (fallbackProfile?.role) {
              fallbackRole = fallbackProfile.role as UserRole
            } else {
              fallbackRole = isAdmin ? 'admin' : 'invitado'
            }
          } catch {
            fallbackRole = isAdmin ? 'admin' : 'invitado'
          }
          
          setUser({
            id: fallbackUser.id,
            email: fallbackUser.email || '',
            role: fallbackRole,
            user_type: 'invitado'
          })
        // Solo inicializar showAdminPanel la primera vez
        if (!adminPanelInitializedRef.current) {
          if (isAdmin) {
            setShowAdminPanel(true) // Los admins van directo al panel
          } else {
            setShowAdminPanel(false)
          }
          adminPanelInitializedRef.current = true
        }
        setShowGuestWelcome(false)
      } else {
          setUser(null)
        }
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError)
        setUser(null)
      }
    } finally {
      stopLoading()
    }
  }, [])

  const checkUser = useCallback(async () => {
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
          setTimeout(() => reject(new Error('Session timeout')), 10000)
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
  }, [user, loadUserProfile])

  // Función para recargar después del login
  const handleAuthSuccess = useCallback(async () => {
    setLoading(true)
    try {
      await checkUser()
    } catch (error) {
      console.error('Error en handleAuthSuccess:', error)
      setLoading(false)
    }
  }, [checkUser])

  useEffect(() => {
    let mounted = true
    let loadingTimeout: NodeJS.Timeout | null = null

    // Si ya hay usuario desde caché, NO hacer nada más
    if (initialUser) {
      console.log('Usuario ya cargado desde caché inicial, omitiendo verificación:', initialUser.email)
      // NO resetear showAdminPanel si ya está configurado - permitir que el usuario lo controle
      // Solo configurar showGuestWelcome
      setShowGuestWelcome(false)
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

    // Timeout de 10 segundos (aumentado para usuarios invitados)
    loadingTimeout = setTimeout(forceStopLoading, 10000)

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
        
        if (!mounted) return // Verificar nuevamente después de async
        
        console.log('Auth state changed (evento crítico):', event, session?.user?.email)
        
        // Solo procesar SIGNED_IN y SIGNED_OUT
        if (event === 'SIGNED_IN' && session?.user) {
          // Solo cargar si NO hay usuario actual o es diferente
          const currentUser = userRef.current
          if (!currentUser || currentUser.id !== session.user.id) {
            if (!mounted) return
            
            if (!isLoadingRef.current) {
              isLoadingRef.current = true
              if (mounted) setLoading(true)
            }
            try {
              await loadUserProfile(session.user.id)
              // Verificar mounted después de async
              if (!mounted) return
            } catch (error) {
              if (!mounted) return
              console.error('Error en loadUserProfile desde onAuthStateChange:', error)
              if (mounted) {
                setLoading(false)
                isLoadingRef.current = false
              }
            }
          } else {
            console.log('Usuario ya cargado, omitiendo recarga')
          }
        } else if (event === 'SIGNED_OUT') {
          if (!mounted) return
          sessionCache.clear()
          if (mounted) {
            setUser(null)
            userRef.current = null
            setLoading(false)
            isLoadingRef.current = false
          }
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
  }, [checkUser, initialUser, loadUserProfile]) // Dependencias correctas

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
    
    // Solo inicializar showAdminPanel la primera vez
    if (!adminPanelInitializedRef.current) {
      if (role === 'admin') {
        setShowAdminPanel(true) // Los admins van directo al panel
      } else {
        setShowAdminPanel(false)
      }
      adminPanelInitializedRef.current = true
    }
    setShowGuestWelcome(false)
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

  const handleGuestLogin = async (phone: string) => {
    try {
      setLoading(true)
      
      // Intentar crear sesión anónima para invitado
      // Si está deshabilitado, usar signUp con email temporal
      let data, error
      
      try {
        const result = await supabase.auth.signInAnonymously()
        data = result.data
        error = result.error
      } catch (anonError: any) {
        // Si anonymous está deshabilitado, usar signUp con email temporal
        if (anonError.message?.includes('disabled') || anonError.message?.includes('Anonymous')) {
          console.log('Anonymous sign-in deshabilitado, usando signUp temporal')
          const email = `invitado_${phone}_${Date.now()}@mtz.local`
          const password = `temp_${Math.random().toString(36).slice(2)}`
          
          const signUpResult = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                is_guest: true,
                phone: phone
              }
            }
          })
          data = signUpResult.data
          error = signUpResult.error
        } else {
          throw anonError
        }
      }
      
      if (error) throw error

      if (data?.user) {
        // Usar email único con timestamp para evitar conflictos
        const uniqueEmail = `invitado_${phone}_${Date.now()}@mtz.local`
        
        // Verificar si ya existe un perfil para este usuario
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id, email')
          .eq('id', data.user.id)
          .maybeSingle()

        if (existingProfile) {
          // Si existe, solo actualizar nombre y tipo sin cambiar email
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              full_name: `Invitado ${phone}`,
              user_type: 'invitado'
            })
            .eq('id', data.user.id)
          
          if (updateError) {
            console.warn('Error al actualizar perfil existente:', updateError)
          }
        } else {
          // Si no existe, crear con email único
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              email: uniqueEmail,
              full_name: `Invitado ${phone}`,
              role: 'invitado',
              user_type: 'invitado',
              is_active: true
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })

          if (profileError) {
            console.warn('Error al crear perfil de invitado:', profileError)
          }
        }

        // Crear o actualizar client_info con el teléfono
        await supabase
          .from('client_info')
          .upsert({
            user_id: data.user.id,
            phone: phone
          }, {
            onConflict: 'user_id'
          })

        // Obtener el email del perfil actualizado
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('email, role, user_type')
          .eq('id', data.user.id)
          .maybeSingle()

        // Establecer usuario como invitado
        // Usar el role del perfil o 'user' como fallback (no 'invitado' que no es un role válido)
        const guestUser: User = {
          id: data.user.id,
          email: profileData?.email || uniqueEmail,
          role: (profileData?.role as UserRole) || 'invitado',
          user_type: (profileData?.user_type as any) || 'invitado'
        }

        setUser(guestUser)
        sessionCache.set({
          id: guestUser.id,
          email: guestUser.email,
          role: guestUser.role,
          user_type: guestUser.user_type
        })
        setShowGuestWelcome(false) // Ir directo al chat
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error en login de invitado:', error)
      alert('Error al ingresar como invitado. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  if (!user) {
    // Si se solicitó autenticación normal desde DevModeSelector, mostrar Auth
    if (showNormalAuth) {
      return (
        <Auth 
          onAuthSuccess={handleAuthSuccess} 
          onGuestLogin={handleGuestLogin}
          onBackToDevMode={() => setShowNormalAuth(false)}
          isFromDevMode={true}
        />
      )
    }
    // En modo desarrollo, mostrar selector de roles
    if (isDev) {
      return (
        <DevModeSelector 
          onSelectRole={handleDevModeSelect}
          onStartNormalAuth={() => setShowNormalAuth(true)}
        />
      )
    }
    // En producción, mostrar autenticación normal
    return <Auth onAuthSuccess={handleAuthSuccess} onGuestLogin={handleGuestLogin} />
  }

  // Si es invitado y debe ver la bienvenida, mostrar sin header ni footer (pantalla completa)
  // IMPORTANTE: Los admins NUNCA ven esta página, incluso si tienen user_type = 'invitado'
  // Solo mostrar si showGuestWelcome es true Y el usuario es invitado Y no ha completado el welcome
  if (showGuestWelcome && 
      user && 
      user.user_type === 'invitado' && 
      user.role !== 'admin' && 
      !welcomeCompleted) {
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
            onContinue={async () => {
              // Marcar que el welcome fue completado
              setWelcomeCompleted(true)
              // Cerrar el welcome inmediatamente - NO volver a mostrarlo
              setShowGuestWelcome(false)
              
              // Actualizar el estado del usuario sin recargar todo el perfil
              try {
                const { data: profile } = await supabase
                  .from('user_profiles')
                  .select('user_type')
                  .eq('id', user.id)
                  .maybeSingle()
                
                if (profile && user) {
                  // Actualizar solo el user_type sin recargar todo
                  const updatedUser = {
                    ...user,
                    user_type: profile.user_type as any
                  }
                  setUser(updatedUser)
                  // Actualizar caché y userRef para evitar que se vuelva a mostrar
                  userRef.current = updatedUser
                  sessionCache.set({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    user_type: profile.user_type as any
                  })
                }
              } catch (error) {
                console.error('Error al actualizar user_type:', error)
              }
              
              // Asegurar que NO se vuelva a mostrar el welcome
              setShowGuestWelcome(false)
            }} 
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`app ${showAdminPanel && user.role === 'admin' ? 'admin-mode' : ''}`}>
      <div className={`container ${showAdminPanel && user.role === 'admin' ? 'admin-container' : ''}`}>
        {!(showAdminPanel && user.role === 'admin') && (
          <header className="header">
            <div>
              <h1>
                Arise -               Arise
                {user.role === 'admin' && <span className="admin-badge">Admin</span>}
              </h1>
              <p>Tu asistente virtual de MTZ. ¿En qué puedo ayudarte hoy?</p>
            </div>
            <div className="header-actions">
              <button
                onClick={() => {
                  // Toggle mute - esto se manejará en ChatInterface
                  const event = new CustomEvent('toggleMute');
                  window.dispatchEvent(event);
                }}
                className="mute-button"
                title="Activar/Desactivar sonido"
                aria-label="Activar/Desactivar sonido"
              >
                🔊
              </button>
              <button onClick={handleLogout} className="logout-button">
                Salir
              </button>
            </div>
          </header>
        )}
        {showAdminPanel && user.role === 'admin' ? (
          <AdminPanel onLogout={handleLogout} />
        ) : (
            <ChatInterface />
        )}
      </div>
    </div>
  )
}

export default App
