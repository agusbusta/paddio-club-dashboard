import { api } from './api';
import { Match, MatchFilters } from '../types/match';

export const matchService = {
  getMatches: async (filters?: MatchFilters): Promise<Match[]> => {
    try {
      const response = await api.get<Match[]>('/matches/', { params: filters });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      // Si el error es 403, significa que el endpoint solo está disponible para super admins
      // En ese caso, retornamos array vacío y el frontend mostrará un mensaje apropiado
      if (error.response?.status === 403) {
        return [];
      }
      throw error;
    }
  },

  getMatchById: async (id: number): Promise<Match> => {
    const response = await api.get<Match>(`/matches/${id}`);
    return response.data;
  },
};
