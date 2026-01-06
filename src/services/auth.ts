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
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('✅ Token guardado. Verificando lectura:', localStorage.getItem('token') ? 'OK' : 'ERROR');
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
