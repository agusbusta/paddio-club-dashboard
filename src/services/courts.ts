import { api } from './api';
import { Court, CourtCreate, CourtUpdate } from '../types/court';

export const courtService = {
  // Obtener todas las canchas (el backend filtra por club_id del admin autenticado)
  getCourts: async (): Promise<Court[]> => {
    try {
      const response = await api.get<Court[]>('/courts/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Error fetching courts:', error);
      throw error;
    }
  },

  // Obtener una cancha por ID
  getCourtById: async (id: number): Promise<Court> => {
    const response = await api.get<Court>(`/courts/${id}`);
    return response.data;
  },

  // Crear una nueva cancha
  createCourt: async (data: CourtCreate): Promise<Court> => {
    const response = await api.post<Court>('/courts/', data);
    return response.data;
  },

  // Actualizar una cancha existente
  updateCourt: async (id: number, data: CourtUpdate): Promise<Court> => {
    const response = await api.put<Court>(`/courts/${id}`, data);
    return response.data;
  },

  // Eliminar una cancha
  deleteCourt: async (id: number): Promise<void> => {
    await api.delete(`/courts/${id}`);
  },
};
