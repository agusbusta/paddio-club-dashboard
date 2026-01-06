import { api } from './api';

export interface LoginCredentials {
  username: string; // email
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    email: string;
    is_admin: boolean;
    club_id?: number;
    must_change_password?: boolean;
  };
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // OAuth2PasswordRequestForm espera application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    
    const response = await api.post<LoginResponse>('/auth/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Guardar token y usuario
    if (response.data.access_token) {
      console.log('💾 Guardando token en localStorage:', response.data.access_token.substring(0, 20) + '...');
      console.log('💾 Dominio actual:', window.location.hostname);
      console.log('💾 URL completa:', window.location.href);
      
      try {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Verificar inmediatamente después de guardar
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        console.log('✅ Token guardado. Verificando lectura:', savedToken ? 'OK' : 'ERROR');
        console.log('✅ Usuario guardado. Verificando lectura:', savedUser ? 'OK' : 'ERROR');
        
        // Verificar después de un pequeño delay para asegurar que se guardó
        setTimeout(() => {
          const delayedToken = localStorage.getItem('token');
          const delayedUser = localStorage.getItem('user');
          console.log('⏱️ Verificación después de 100ms - Token:', delayedToken ? 'OK' : 'ERROR');
          console.log('⏱️ Verificación después de 100ms - Usuario:', delayedUser ? 'OK' : 'ERROR');
          
          if (!delayedToken) {
            console.error('🚨 CRÍTICO: El token desapareció inmediatamente después de guardarlo!');
          }
        }, 100);
        
        // Verificar después de 1 segundo y 5 segundos también
        setTimeout(() => {
          const token1s = localStorage.getItem('token');
          const user1s = localStorage.getItem('user');
          console.log('⏱️ Verificación después de 1s - Token:', token1s ? 'OK' : 'ERROR');
          console.log('⏱️ Verificación después de 1s - Usuario:', user1s ? 'OK' : 'ERROR');
        }, 1000);
        
        setTimeout(() => {
          const token5s = localStorage.getItem('token');
          const user5s = localStorage.getItem('user');
          console.log('⏱️ Verificación después de 5s - Token:', token5s ? 'OK' : 'ERROR');
          console.log('⏱️ Verificación después de 5s - Usuario:', user5s ? 'OK' : 'ERROR');
        }, 5000);
      } catch (error) {
        console.error('❌ Error al guardar en localStorage:', error);
        throw error;
      }
    } else {
      console.error('❌ No se recibió access_token en la respuesta');
    }
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    const token = localStorage.getItem('token');
    console.log('🔑 getToken llamado. Token encontrado:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.post('/auth/change-password', data);
  },
};
