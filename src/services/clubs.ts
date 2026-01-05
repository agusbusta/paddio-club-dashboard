import { api } from './api';
import { Club, ClubUpdate } from '../types/club';

export const clubService = {
  // Obtener información del club del admin autenticado
  // Requiere pasar el club_id del usuario autenticado
  getMyClub: async (clubId: number): Promise<Club> => {
    if (!clubId) {
      throw new Error('No tienes un club asignado');
    }
    
    const response = await api.get<Club>(`/clubs/${clubId}`);
    return response.data;
  },

  // Obtener club por ID
  getClubById: async (id: number): Promise<Club> => {
    const response = await api.get<Club>(`/clubs/${id}`);
    return response.data;
  },

  // Actualizar información del club
  updateClub: async (id: number, data: ClubUpdate): Promise<Club> => {
    const response = await api.put<Club>(`/clubs/${id}`, data);
    return response.data;
  },

  // Regenerar turnos después de cambiar horarios
  generateTurns: async (id: number, daysAhead: number = 30): Promise<void> => {
    await api.post(`/clubs/${id}/generate-turns`, null, {
      params: { days_ahead: daysAhead },
    });
  },
};
