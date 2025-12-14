import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { sessionCache } from '../lib/sessionCache';
import type { UserRole, UserType } from '../types';

interface User {
  id: string;
  email: string;
  role: UserRole;
  user_type?: 'invitado' | 'cliente_nuevo' | 'cliente_existente';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  devMode: boolean;
  setDevMode: (mode: boolean) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicialización desde caché
  const cachedUser = sessionCache.get();
  
  // DEBUG USER CHECK
  const getDebugUser = () => {
    try {
        const str = localStorage.getItem('MTZ_DEBUG_USER');
        if (!str) return null;
        const parsed = JSON.parse(str);
        if (parsed && parsed.id) return {
            id: parsed.id,
            email: parsed.email || 'debug@mtz.cl',
            role: parsed.role || 'cliente',
            user_type: parsed.user_type || 'cliente_existente'
        };
    } catch(e) { console.warn('Invalid debug user', e); }
    return null;
  };
  const debugUser = getDebugUser();

  const initialUser = debugUser || (cachedUser && cachedUser.id && sessionCache.isValid() 
    ? {
        id: cachedUser.id,
        email: cachedUser.email,
        role: cachedUser.role as UserRole,
        user_type: cachedUser.user_type as any
      }
    : null);

  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [devMode, setDevMode] = useState(false);
  
  const isLoadingRef = useRef(false);

  const loadUserProfile = useCallback(async (userId: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);

    try {
      console.log('Cargando perfil para usuario:', userId);
      
      // Obtener Auth User de Supabase
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        // Fallback a caché si existe
        if (cachedUser && cachedUser.id === userId) {
          setUser(initialUser);
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
        throw new Error('No usuario autenticado');
      }

      const userEmail = authUser.email || '';
      
      // Intentar obtener perfil de BD
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        const newUser: User = {
          id: userId,
          email: userEmail,
          role: profile.role as UserRole,
          user_type: profile.user_type as any || 'invitado'
        };
        setUser(newUser);
        sessionCache.set(newUser);
      } else {
        // Crear perfil básico si no existe
        const defaultUser: User = {
            id: userId,
            email: userEmail,
            role: 'invitado', // Default
            user_type: 'invitado'
        };
        
        // Intentar crearlo en BD (fire and forget)
        supabase.from('user_profiles').insert({
            id: userId,
            email: userEmail,
            role: 'invitado',
            user_type: 'invitado',
            full_name: authUser.user_metadata?.full_name || userEmail.split('@')[0]
        }).then(() => console.log('Perfil creado'), console.error);


        setUser(defaultUser);
        sessionCache.set(defaultUser);
      }

    } catch (error) {
      console.error('Error cargando perfil:', error);
      setUser(null);
      sessionCache.clear();
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Escuchar cambios de sesión
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth State Change:', event);
      if (session?.user) {
        // Solo recargar si el usuario cambió
        if (session.user.id !== user?.id) {
            await loadUserProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        sessionCache.clear();
        setLoading(false);
      }
    });

    // Check inicial si no hay usuario (y no teníamos caché válida)
    if (!user && !debugUser) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });
    } else if (debugUser) {
        setLoading(false); // Valid debug user loaded instantly
    }

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionCache.clear();
  };

  const refreshProfile = async () => {
    if (user?.id) await loadUserProfile(user.id);
  };

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    devMode,
    setDevMode,
    refreshProfile,
    signOut,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
