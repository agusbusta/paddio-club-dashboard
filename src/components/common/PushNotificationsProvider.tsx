import React, { ReactNode } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface PushNotificationsProviderProps {
  children: ReactNode;
}

export const PushNotificationsProvider: React.FC<PushNotificationsProviderProps> = ({ children }) => {
  usePushNotifications();
  return <>{children}</>;
};
