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
      
      // Lanzar un error específico para que se maneje apropiadamente
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
      // Token expirado o inválido - limpiar sesión y redirigir
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);
