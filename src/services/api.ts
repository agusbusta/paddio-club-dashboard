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
      // Solo redirigir si no estamos en la página de login y no es la verificación inicial
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      
      if (window.location.pathname !== '/login' && !isAuthCheck) {
        // Limpiar sesión solo si no es la verificación inicial
        // La verificación inicial la maneja AuthContext
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Usar replace para evitar agregar al historial
        window.location.replace('/login');
      } else if (isAuthCheck) {
        // Si es la verificación inicial y falla con 401, limpiar localStorage
        // pero dejar que AuthContext maneje la redirección
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);
