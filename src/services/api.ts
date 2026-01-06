import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Log para debug (siempre, para verificar en producción)
console.log('🌐 API Base URL configurada:', API_BASE_URL);
console.log('🌐 REACT_APP_API_URL desde env:', process.env.REACT_APP_API_URL || 'NO CONFIGURADO');

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
    // Agregar header para evitar la página de advertencia de ngrok
    // ngrok requiere este header para saltarse la página de advertencia del navegador
    config.headers['ngrok-skip-browser-warning'] = 'true';
    
    // También agregar como parámetro de query string si la URL es de ngrok
    if (API_BASE_URL.includes('ngrok') && config.url) {
      // Si la URL ya tiene parámetros de query, agregar el nuestro
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}ngrok-skip-browser-warning=true`;
    }
    
    // Log para debug (siempre para verificar en producción)
    console.log('📤 [API] Request:', config.method?.toUpperCase(), config.url);
    console.log('📤 [API] Headers:', {
      'Authorization': config.headers.Authorization ? 'Bearer ***' : 'none',
      'ngrok-skip-browser-warning': config.headers['ngrok-skip-browser-warning'],
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    // Verificar si ngrok está interceptando y devolviendo HTML
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html>')) {
      console.error('🚨 [API] ngrok está interceptando la petición:', response.config.url);
      console.error('🚨 [API] Devuelve HTML en lugar de JSON');
      
      // Si es una petición de autenticación, no lanzar error (ya se maneja en AuthContext)
      if (response.config.url?.includes('/auth/me')) {
        return response; // Dejar que AuthContext lo maneje
      }
      
      // Para otras peticiones, lanzar un error específico
      const error = new Error('ngrok está interceptando la petición');
      (error as any).isNgrokInterception = true;
      (error as any).response = response;
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    // Verificar si el error es por ngrok interceptando
    if (error.response && typeof error.response.data === 'string' && error.response.data.trim().startsWith('<!DOCTYPE html>')) {
      console.error('🚨 [API] Error: ngrok está interceptando la petición:', error.config?.url);
      const ngrokError = new Error('ngrok está interceptando la petición');
      (ngrokError as any).isNgrokInterception = true;
      (ngrokError as any).response = error.response;
      return Promise.reject(ngrokError);
    }
    
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
