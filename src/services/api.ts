import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Log para debug (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  // No establecer Content-Type por defecto para permitir diferentes tipos en diferentes requests
});

// Interceptor para agregar token y Content-Type por defecto a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Agregar Content-Type por defecto solo si no está definido (permite sobrescribir para login)
    if (!config.headers['Content-Type'] && !config.headers['content-type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      
      // NO hacer nada si es la verificación inicial (/auth/me)
      // Dejar que AuthContext maneje completamente este caso
      if (!isAuthCheck && window.location.pathname !== '/login') {
        // Solo redirigir y limpiar si NO es la verificación inicial
        // y NO estamos ya en login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login');
      }
      // Si es /auth/me, NO hacer nada aquí - AuthContext lo maneja
    }
    return Promise.reject(error);
  }
);
