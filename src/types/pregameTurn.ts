export enum PregameTurnStatus {
  AVAILABLE = 'AVAILABLE',
  PENDING = 'PENDING',
  READY_TO_PLAY = 'READY_TO_PLAY',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface PlayerPosition {
  position: string; // "player1", "player2", "player3", "player4"
  player_id: number;
  player_name?: string;
  player_side: 'drive' | 'reves';
  player_court_position: 'izquierda' | 'derecha';
}

export interface PregameTurn {
  id: number;
  turn_id: number;
  court_id: number;
  court_name?: string;
  selected_court_id?: number;
  date: string; // ISO date string
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  price: number; // Precio en centavos
  status: PregameTurnStatus;
  player1_id?: number;
  player2_id?: number;
  player3_id?: number;
  player4_id?: number;
  player1_side?: 'drive' | 'reves';
  player1_court_position?: 'izquierda' | 'derecha';
  player2_side?: 'drive' | 'reves';
  player2_court_position?: 'izquierda' | 'derecha';
  player3_side?: 'drive' | 'reves';
  player3_court_position?: 'izquierda' | 'derecha';
  player4_side?: 'drive' | 'reves';
  player4_court_position?: 'izquierda' | 'derecha';
  category_restricted?: boolean;
  category_restriction_type?: string;
  organizer_category?: string;
  is_mixed_match?: boolean;
  free_category?: string;
  cancellation_message?: string;
  created_at?: string;
  updated_at?: string;
  // Información adicional del endpoint
  players_count?: number;
  players_needed?: number;
  assigned_players?: PlayerPosition[];
}

export interface PregameTurnUpdate {
  status?: PregameTurnStatus;
  selected_court_id?: number;
  date?: string; // ISO date string
  start_time?: string; // "HH:MM"
  end_time?: string; // "HH:MM"
  player1_id?: number | null;
  player2_id?: number | null;
  player3_id?: number | null;
  player4_id?: number | null;
  player1_side?: 'drive' | 'reves';
  player1_court_position?: 'izquierda' | 'derecha';
  player2_side?: 'drive' | 'reves';
  player2_court_position?: 'izquierda' | 'derecha';
  player3_side?: 'drive' | 'reves';
  player3_court_position?: 'izquierda' | 'derecha';
  player4_side?: 'drive' | 'reves';
  player4_court_position?: 'izquierda' | 'derecha';
  category_restricted?: boolean;
  category_restriction_type?: string;
  organizer_category?: string;
  is_mixed_match?: boolean;
  free_category?: string;
  cancellation_message?: string;
}

export interface PregameTurnsResponse {
  club_id: number;
  club_name: string;
  pregame_turns: PregameTurn[];
  total_pregame_turns: number;
}
