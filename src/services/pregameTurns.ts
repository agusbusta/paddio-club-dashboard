import { api } from './api';
import { PregameTurn, PregameTurnUpdate, PregameTurnsResponse } from '../types/pregameTurn';

export const pregameTurnService = {
  // Obtener pregame turns de un club para una fecha específica
  getPregameTurnsForClub: async (
    clubId: number,
    targetDate?: string // Formato YYYY-MM-DD
  ): Promise<PregameTurnsResponse> => {
    const params: any = {};
    if (targetDate) {
      params.target_date = targetDate;
    }
    const response = await api.get<PregameTurnsResponse>(
      `/pregame-turns/clubs/${clubId}/pregame-turns`,
      { params }
    );
    return response.data;
  },

  // Actualizar un pregame turn
  updatePregameTurn: async (
    pregameTurnId: number,
    data: PregameTurnUpdate
  ): Promise<PregameTurn> => {
    const response = await api.put<PregameTurn>(
      `/pregame-turns/${pregameTurnId}`,
      data
    );
    return response.data;
  },

  // Obtener un pregame turn por ID
  getPregameTurnById: async (pregameTurnId: number): Promise<PregameTurn> => {
    const response = await api.get<PregameTurn>(
      `/pregame-turns/${pregameTurnId}`
    );
    return response.data;
  },

  // Crear un turno desde cero por el club
  createTurnByClub: async (params: {
    club_id: number;
    start_time: string;
    target_date: string; // YYYY-MM-DD
    court_id: number;
    organizer_player_id: number;
    player_side?: string;
    player_position?: string;
    category_restricted?: boolean;
    category_restriction_type?: string;
    is_mixed_match?: boolean;
    free_category?: string;
  }): Promise<{ success: boolean; message: string; turn_id: number; pregame_turn: PregameTurn }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('club_id', params.club_id.toString());
    queryParams.append('start_time', params.start_time);
    queryParams.append('target_date', params.target_date);
    queryParams.append('court_id', params.court_id.toString());
    queryParams.append('organizer_player_id', params.organizer_player_id.toString());
    
    if (params.player_side) queryParams.append('player_side', params.player_side);
    if (params.player_position) queryParams.append('player_position', params.player_position);
    if (params.category_restricted !== undefined) queryParams.append('category_restricted', params.category_restricted.toString());
    if (params.category_restriction_type) queryParams.append('category_restriction_type', params.category_restriction_type);
    if (params.is_mixed_match !== undefined) queryParams.append('is_mixed_match', params.is_mixed_match.toString());
    if (params.free_category) queryParams.append('free_category', params.free_category);
    
    const response = await api.post<{ success: boolean; message: string; turn_id: number; pregame_turn: PregameTurn }>(
      `/pregame-turns/create-turn-by-club?${queryParams.toString()}`
    );
    return response.data;
  },
};
