import { api } from './api';
import { InvitationsResponse } from '../types/invitation';
import { NotificationActionResponse } from '../types/notification';

export const invitationService = {
  // Obtener todas las invitaciones de un turno
  getInvitationsByTurn: async (turnId: number): Promise<InvitationsResponse> => {
    const response = await api.get<InvitationsResponse>(`/invitations/turn/${turnId}`);
    return response.data;
  },

  // Cancelar una invitación
  cancelInvitation: async (invitationId: number): Promise<NotificationActionResponse> => {
    const response = await api.delete<NotificationActionResponse>(`/invitations/${invitationId}`);
    return response.data;
  },
};
