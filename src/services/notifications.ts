import { api } from './api';
import { Notification, NotificationsListResponse, NotificationActionResponse } from '../types/notification';

export const notificationService = {
  // Obtener todas las notificaciones del usuario actual
  getNotifications: async (): Promise<NotificationsListResponse> => {
    const response = await api.get<NotificationsListResponse>('/notifications/');
    return response.data;
  },

  // Marcar una notificación como leída
  markAsRead: async (notificationId: number): Promise<NotificationActionResponse> => {
    const response = await api.put<NotificationActionResponse>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: async (): Promise<NotificationActionResponse> => {
    const response = await api.put<NotificationActionResponse>('/notifications/read-all');
    return response.data;
  },

  // Eliminar una notificación
  deleteNotification: async (notificationId: number): Promise<NotificationActionResponse> => {
    const response = await api.delete<NotificationActionResponse>(
      `/notifications/${notificationId}`
    );
    return response.data;
  },
};
