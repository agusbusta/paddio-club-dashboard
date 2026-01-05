export interface MatchPlayer {
  id: number;
  name: string;
  email: string;
  gender?: string;
}

export interface Match {
  id: number;
  court_id: number;
  court_name?: string;
  club_id?: number;
  club_name?: string;
  start_time: string;
  end_time: string;
  status: string;
  score?: string;
  created_at: string;
  creator_id: number;
  creator_name?: string;
  creator_email?: string;
  players: MatchPlayer[];
}

export interface MatchFilters {
  skip?: number;
  limit?: number;
  status?: string;
  club_id?: number;
  start_date?: string;
  end_date?: string;
}
