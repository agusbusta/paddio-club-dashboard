import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
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
    console.log('🚀 initializeUserFromStorage: Inicializando desde localStorage...');
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
    try {
      const token = authService.getToken();
      if (!token) {
        console.log('🔍 checkAuth: No hay token, limpiando sesión');
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('🔍 checkAuth: Verificando token con backend...');
      // Verificar token con el backend
      const response = await api.get('/auth/me');
      console.log('✅ checkAuth: Respuesta del backend recibida', response.data);
      
      const userData = response.data.user || response.data;
      
      // Verificar que sea admin y tenga club
      if (userData.is_admin && userData.club_id) {
        console.log('✅ checkAuth: Usuario válido (admin con club)');
        const updatedUser = {
          id: String(userData.id),
          name: userData.name,
          email: userData.email,
          is_admin: userData.is_admin,
          club_id: userData.club_id,
          must_change_password: userData.must_change_password,
        };
        setUser(updatedUser);
        // Actualizar localStorage con datos frescos
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.log('❌ checkAuth: Usuario no es admin o no tiene club');
        // No es admin o no tiene club, limpiar sesión
        authService.logout();
        setUser(null);
      }
    } catch (error: any) {
      console.error('❌ checkAuth: Error verificando auth:', error);
      console.error('❌ checkAuth: Error details:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
      });
      
      // Solo limpiar sesión si es un error 401 (no autorizado)
      if (error.response?.status === 401) {
        console.log('❌ checkAuth: Token inválido o expirado (401), limpiando sesión');
        // Token inválido o expirado
        authService.logout();
        setUser(null);
      } else if (error.response && error.response.status >= 400) {
        // Otro error HTTP (403, 404, 500, etc.), mantener usuario del localStorage
        // No limpiar sesión para errores temporales del servidor
        console.warn('⚠️ checkAuth: Error HTTP al verificar auth, manteniendo sesión local:', error.response.status);
        // Mantener el usuario del localStorage (ya está inicializado)
      } else {
        // Error de red (sin conexión), mantener usuario del localStorage
        // El usuario ya está inicializado desde localStorage, no hacer nada
        console.warn('⚠️ checkAuth: Error de red al verificar auth, usando sesión local');
        // Mantener el usuario del localStorage (ya está inicializado)
      }
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
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
