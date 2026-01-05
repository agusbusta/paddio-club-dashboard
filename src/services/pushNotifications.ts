import { api } from './api';

export interface FCMTokenCreate {
  token: string;
  device_type: 'web' | 'android' | 'ios';
}

export interface FCMTokenResponse {
  id: number;
  token: string;
  device_type: string;
  user_id: number;
  created_at: string;
}

export const pushNotificationService = {
  // Solicitar permiso para notificaciones del navegador
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  },

  // Verificar si las notificaciones están permitidas
  isPermissionGranted: (): boolean => {
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted';
  },

  // Registrar token FCM en el backend
  registerToken: async (token: string): Promise<FCMTokenResponse> => {
    const response = await api.post<FCMTokenResponse>('/notifications/register-token', {
      token,
      device_type: 'web',
    });
    return response.data;
  },

  // Mostrar notificación del navegador
  showBrowserNotification: (title: string, options?: NotificationOptions) => {
    if (!pushNotificationService.isPermissionGranted()) {
      console.warn('Permisos de notificación no concedidos');
      return null;
    }

    // Reproducir sonido
    pushNotificationService.playNotificationSound();

    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      requireInteraction: false,
      ...options,
    });

    // Cerrar automáticamente después de 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  },

  // Reproducir sonido de notificación
  playNotificationSound: () => {
    try {
      // Crear un audio context para generar un sonido
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar sonido de alerta (dos tonos)
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Segundo tono
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.3);
      }, 200);
    } catch (error) {
      console.warn('Error reproduciendo sonido de notificación:', error);
    }
  },
};
