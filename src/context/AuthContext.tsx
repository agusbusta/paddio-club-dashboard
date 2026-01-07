import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, LoginCredentials } from '../services/auth';

interface User {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  club_id?: number;
  must_change_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ user: User }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Inicializar usuario desde localStorage inmediatamente para evitar redirección prematura
  const initializeUserFromStorage = (): User | null => {
    console.log('🚀 [REACT] initializeUserFromStorage: Inicializando desde localStorage...');
    console.log('🚀 [REACT] Dominio actual:', window.location.hostname);
    console.log('🚀 [REACT] URL completa:', window.location.href);
    console.log('🚀 [REACT] localStorage.length:', localStorage.length);
    
    // Verificar el timestamp de debug
    const debugCheck = localStorage.getItem('_debug_check');
    console.log('🚀 [REACT] Timestamp de debug:', debugCheck ? 'OK' : 'NO ENCONTRADO');
    
    // Verificar todo el contenido de localStorage
    console.log('🚀 [REACT] Contenido completo de localStorage:');
    if (localStorage.length === 0) {
      console.log('  ⚠️ localStorage está COMPLETAMENTE VACÍO');
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          console.log(`  - ${key}: ${value ? (key === 'token' ? `${value.substring(0, 20)}...` : value.substring(0, 50) + '...') : 'null'}`);
        }
      }
    }
    
    const token = authService.getToken();
    console.log('🚀 initializeUserFromStorage: Token encontrado:', token ? 'Sí' : 'No');
    
    if (!token) {
      console.log('🚀 initializeUserFromStorage: No hay token, retornando null');
      return null;
    }
    
    const savedUser = authService.getCurrentUser();
    console.log('🚀 initializeUserFromStorage: Usuario guardado:', savedUser ? `${savedUser.name} (admin: ${savedUser.is_admin}, club: ${savedUser.club_id})` : 'null');
    
    if (savedUser && savedUser.is_admin && savedUser.club_id) {
      const user = {
        id: String(savedUser.id),
        name: savedUser.name,
        email: savedUser.email,
        is_admin: savedUser.is_admin,
        club_id: savedUser.club_id,
        must_change_password: savedUser.must_change_password,
      };
      console.log('✅ initializeUserFromStorage: Usuario válido inicializado');
      return user;
    }
    console.log('❌ initializeUserFromStorage: Usuario no válido (no es admin o no tiene club)');
    return null;
  };

  const [user, setUser] = useState<User | null>(initializeUserFromStorage);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    // Simplificado: solo verificar que haya token y usuario en localStorage
    // El token se validará automáticamente cuando se haga cualquier petición
    // Si el token es inválido, el interceptor de API manejará el 401
    const token = authService.getToken();
    if (!token) {
      console.log('🔍 checkAuth: No hay token, limpiando sesión');
      setUser(null);
      setIsLoading(false);
      return;
    }

    // El usuario ya está inicializado desde localStorage
    // No necesitamos verificar con el backend al inicio
    // Si el token es inválido, las peticiones fallarán con 401 y el interceptor lo manejará
    console.log('✅ checkAuth: Token encontrado, usuario ya inicializado desde localStorage');
    setIsLoading(false);
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);

      // Verificar que el usuario sea admin y tenga un club
      if (!response.user.is_admin) {
        throw new Error('No tienes permisos para acceder a este dashboard');
      }

      if (!response.user.club_id) {
        throw new Error('No tienes un club asignado. Contacta al administrador.');
      }

      const userData = {
        id: String(response.user.id),
        name: response.user.name,
        email: response.user.email,
        is_admin: response.user.is_admin,
        club_id: response.user.club_id,
        must_change_password: response.user.must_change_password,
      };

      setUser(userData);
      
      // Verificar que el token esté en localStorage después de setear el usuario
      const tokenAfterSetUser = localStorage.getItem('token');
      const userAfterSetUser = localStorage.getItem('user');
      console.log('🔍 [AUTH_CONTEXT] Después de setUser - Token:', tokenAfterSetUser ? 'OK' : 'ERROR');
      console.log('🔍 [AUTH_CONTEXT] Después de setUser - User:', userAfterSetUser ? 'OK' : 'ERROR');
      
      return { user: userData };
    } catch (error: any) {
      authService.logout();
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Listener para detectar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        console.log('🔔 Storage Event: Token cambió en localStorage', {
          oldValue: e.oldValue ? `${e.oldValue.substring(0, 20)}...` : 'null',
          newValue: e.newValue ? `${e.newValue.substring(0, 20)}...` : 'null',
          url: e.url,
        });
      }
    };

    // Escuchar cambios en localStorage desde otras pestañas/ventanas
    window.addEventListener('storage', handleStorageChange);

    // Verificar el token periódicamente para detectar si se está limpiando
    const checkTokenInterval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (!currentToken && user) {
        console.error('🚨 ALERTA: Token desapareció de localStorage mientras el usuario está autenticado!');
        console.error('🚨 Usuario actual:', user);
        console.error('🚨 Stack trace:', new Error().stack);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkTokenInterval);
    };
  }, [user]);

  useEffect(() => {
    // Verificar inmediatamente al montar
    console.log('🔄 useEffect checkAuth: Iniciando verificación de autenticación...');
    console.log('🔄 Token en localStorage al iniciar checkAuth:', localStorage.getItem('token') ? 'Sí' : 'No');
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
