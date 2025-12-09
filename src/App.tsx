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
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showGuestWelcome, setShowGuestWelcome] = useState(false)
  const [welcomeCompleted, setWelcomeCompleted] = useState(false) // Bandera para evitar que se vuelva a mostrar
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
        setShowGuestWelcome(true)
        stopLoading()
        return
      }

      const userEmail = authUser.email || ''
      const isAdmin = userEmail === 'mtzcontabilidad@gmail.com'

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
          if (isAdmin) {
            setShowAdminPanel(true)
            setShowGuestWelcome(false)
          } else {
            setShowAdminPanel(false)
            setShowGuestWelcome(true)
          }
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
        
        if (userRole === 'admin') {
          setShowAdminPanel(true)
          setShowGuestWelcome(false)
        } else {
          setShowAdminPanel(false)
          // SIMPLIFICADO: Ya no mostramos welcome, vamos directo al chat
          setShowGuestWelcome(false)
        }
      } else {
        const userData: User = {
          id: userId,
          email: userEmail,
          role: isAdmin ? 'admin' : 'invitado',
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
        
        if (isAdmin) {
          setShowAdminPanel(true)
          setShowGuestWelcome(false)
        } else {
          setShowAdminPanel(false)
          setShowGuestWelcome(true)
        }
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error)
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
          if (isAdmin) {
            setShowAdminPanel(true)
            setShowGuestWelcome(false)
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
      // Configurar estados según el usuario
      if (initialUser.role === 'admin') {
        setShowAdminPanel(true)
        setShowGuestWelcome(false)
      } else {
        setShowAdminPanel(false)
        // SIMPLIFICADO: Ya no mostramos welcome, vamos directo al chat
        setShowGuestWelcome(false)
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
    
    // Configurar estados según el rol
    if (role === 'admin') {
      setShowAdminPanel(true)
      setShowGuestWelcome(false)
      } else {
        setShowAdminPanel(false)
        // SIMPLIFICADO: Ya no mostramos welcome, vamos directo al chat
        setShowGuestWelcome(false)
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
        // El trigger handle_new_user ya crea el perfil automáticamente
        // Solo actualizamos el email y nombre con el teléfono
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            email: `invitado_${phone}@mtz.local`,
            full_name: `Invitado ${phone}`,
            user_type: 'invitado'
          })
          .eq('id', data.user.id)

        if (profileError) {
          console.warn('Error al actualizar perfil de invitado:', profileError)
          // Si falla el update, intentar upsert como fallback
          await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              email: `invitado_${phone}@mtz.local`,
              full_name: `Invitado ${phone}`,
              role: 'user',
              user_type: 'invitado'
            }, {
              onConflict: 'id'
            })
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

        // Establecer usuario como invitado
        const guestUser: User = {
          id: data.user.id,
          email: `invitado_${phone}@mtz.local`,
          role: 'invitado',
          user_type: 'invitado'
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
    // En modo desarrollo, mostrar selector de roles
    if (isDev) {
      return <DevModeSelector onSelectRole={handleDevModeSelect} />
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
        <header className="header">
          <div>
            <h1>
              Arise -               Arise
              {user.role === 'admin' && <span className="admin-badge">Admin</span>}
            </h1>
            <p>Tu asistente virtual de MTZ. ¿En qué puedo ayudarte hoy?</p>
          </div>
          <div className="header-actions">
            {user.role === 'admin' && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="admin-toggle-button"
              >
                {showAdminPanel ? 'Arise' : 'Panel Admin'}
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
