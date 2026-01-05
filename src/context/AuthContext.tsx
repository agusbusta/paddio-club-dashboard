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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Verificar token con el backend
      const response = await api.get('/auth/me');
      const userData = response.data.user || response.data;
      
      // Verificar que sea admin y tenga club
      if (userData.is_admin && userData.club_id) {
        setUser({
          id: String(userData.id),
          name: userData.name,
          email: userData.email,
          is_admin: userData.is_admin,
          club_id: userData.club_id,
          must_change_password: userData.must_change_password,
        });
      } else {
        // No es admin o no tiene club, limpiar sesión
        authService.logout();
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      authService.logout();
      setUser(null);
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
