import { api } from './api';

export interface Player {
  id: number;
  name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_image_url?: string;
  level?: string;
  preferred_side?: string;
  location?: string;
  category?: string;
  gender?: string;
}

export const playerService = {
  // Buscar jugadores
  searchPlayers: async (query?: string, turnId?: number): Promise<Player[]> => {
    const params: any = {};
    if (query) params.q = query;
    if (turnId) params.turn_id = turnId;
    
    const response = await api.get<Player[]>('/players/search', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  // Obtener un jugador por ID (usa el endpoint de usuarios ya que los jugadores son usuarios)
  getPlayerById: async (id: number): Promise<Player> => {
    try {
      const response = await api.get<Player>(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      // Si falla, intentar con el endpoint de búsqueda
      if (error.response?.status === 404) {
        const searchResponse = await api.get<Player[]>('/players/search');
        const player = searchResponse.data.find(p => p.id === id);
        if (player) return player;
      }
      throw error;
    }
  },
};
