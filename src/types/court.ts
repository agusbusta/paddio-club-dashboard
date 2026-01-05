export interface Court {
  id: number;
  name: string;
  description?: string;
  club_id: number;
  surface_type?: string;
  is_indoor: boolean;
  has_lighting: boolean;
  is_available: boolean;
  created_at?: string;
}

export interface CourtCreate {
  name: string;
  description?: string;
  club_id: number;
  surface_type: string;
  is_indoor: boolean;
  has_lighting: boolean;
  is_available: boolean;
}

export interface CourtUpdate {
  name?: string;
  description?: string;
  surface_type?: string;
  is_indoor?: boolean;
  has_lighting?: boolean;
  is_available?: boolean;
}

export const SURFACE_TYPES = [
  { value: 'artificial_grass', label: 'Césped Sintético' },
  { value: 'cement', label: 'Cemento' },
  { value: 'carpet', label: 'Moqueta' },
] as const;
