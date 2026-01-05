export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationsListResponse {
  success: boolean;
  notifications: Notification[];
  unread_count: number;
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
}
