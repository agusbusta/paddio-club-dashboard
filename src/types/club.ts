export interface TurnDataItem {
  court_id: number;
  court_name: string;
  start_time: string; // Formato "HH:MM"
  end_time: string; // Formato "HH:MM"
  price: number; // Precio en centavos
}

export interface TurnData {
  club_id: number;
  club_name: string;
  turns: TurnDataItem[];
}

export interface Club {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  opening_time?: string; // Formato "HH:MM:SS" o "HH:MM"
  closing_time?: string; // Formato "HH:MM:SS" o "HH:MM"
  turn_duration_minutes?: number;
  price_per_turn?: number; // En centavos
  monday_open?: boolean;
  tuesday_open?: boolean;
  wednesday_open?: boolean;
  thursday_open?: boolean;
  friday_open?: boolean;
  saturday_open?: boolean;
  sunday_open?: boolean;
  created_at?: string;
  turns_data?: TurnData; // Template de turnos del club
}

export interface ClubUpdate {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  opening_time?: string; // Formato "HH:MM:SS" o "HH:MM"
  closing_time?: string; // Formato "HH:MM:SS" o "HH:MM"
  turn_duration_minutes?: number;
  price_per_turn?: number; // En centavos
  monday_open?: boolean;
  tuesday_open?: boolean;
  wednesday_open?: boolean;
  thursday_open?: boolean;
  friday_open?: boolean;
  saturday_open?: boolean;
  sunday_open?: boolean;
}
