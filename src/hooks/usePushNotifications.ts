import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notifications';
import { pushNotificationService } from '../services/pushNotifications';
import toast from 'react-hot-toast';

export const usePushNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const processedNotificationIds = useRef<Set<number>>(new Set());

  // Solicitar permisos al iniciar sesión
  useEffect(() => {
    if (isAuthenticated && user) {
      pushNotificationService.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('✅ Permisos de notificación concedidos');
        } else {
          console.warn('⚠️ Permisos de notificación denegados');
        }
      });
    }
  }, [isAuthenticated, user]);

  // Escuchar nuevas notificaciones (sin polling - las notificaciones llegan por push)
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    enabled: isAuthenticated,
    refetchOnWindowFocus: true, // Solo refrescar cuando la ventana recupera el foco
    // Sin refetchInterval - las notificaciones llegan en tiempo real por push
  });

  // Detectar nuevas notificaciones no leídas
  useEffect(() => {
    if (!notificationsData?.notifications) return;

    const unreadNotifications = notificationsData.notifications.filter((n) => !n.is_read);
    
    if (unreadNotifications.length === 0) return;

    // Filtrar solo las notificaciones nuevas (que no hemos procesado)
    const newNotifications = unreadNotifications.filter(
      (n) => !processedNotificationIds.current.has(n.id)
    );

    if (newNotifications.length === 0) return;

    console.log('🔔 Nuevas notificaciones detectadas:', newNotifications.length, newNotifications.map(n => ({ id: n.id, type: n.type, title: n.title })));

    // Marcar como procesadas
    newNotifications.forEach((n) => {
      processedNotificationIds.current.add(n.id);
    });

    // Invalidar la query de notificaciones para actualizar la lista cuando hay nuevas notificaciones
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    // Separar notificaciones importantes (cancelación y creación de turno)
    const importantNotifications = newNotifications.filter(
      (n) => n.type === 'turn_cancelled' || n.type === 'external_request'
    );
    const otherNotifications = newNotifications.filter(
      (n) => n.type !== 'turn_cancelled' && n.type !== 'external_request'
    );

    // Procesar notificaciones importantes con alerta máxima
    importantNotifications.forEach((notification) => {
      const isCancelled = notification.type === 'turn_cancelled';
      
      console.log('🚨 Procesando notificación importante:', notification.type, notification.title);
      
      // Notificación del navegador con sonido
      pushNotificationService.showBrowserNotification(notification.title, {
        body: notification.message,
        tag: `${notification.type}_${notification.id}`,
        requireInteraction: true, // Requiere interacción
      });

      // Toast muy visible
      toast.error(notification.title, {
        duration: 10000,
        icon: isCancelled ? '🚨' : '🔔',
        style: {
          background: isCancelled ? '#ff4444' : '#FFA500', // Rojo para cancelación, naranja para creación
          color: '#fff',
          fontSize: '16px',
          padding: '20px',
          borderRadius: '12px',
          fontWeight: 'bold',
          boxShadow: isCancelled 
            ? '0 8px 32px rgba(255, 68, 68, 0.4)' 
            : '0 8px 32px rgba(255, 165, 0, 0.4)',
        },
      });
    });

    // Procesar otras notificaciones de forma normal
    otherNotifications.forEach((notification) => {
      pushNotificationService.showBrowserNotification(notification.title, {
        body: notification.message,
        tag: `notification_${notification.id}`,
      });

      toast(notification.title, {
        duration: 5000,
        icon: '🔔',
      });
    });
  }, [notificationsData, queryClient]);

  // Limpiar IDs procesados cuando el usuario cierra sesión
  useEffect(() => {
    if (!isAuthenticated) {
      processedNotificationIds.current.clear();
    }
  }, [isAuthenticated]);

  return {
    isPermissionGranted: pushNotificationService.isPermissionGranted(),
    requestPermission: pushNotificationService.requestPermission,
  };
};
