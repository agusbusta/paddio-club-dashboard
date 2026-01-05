export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface Invitation {
  id: number;
  turn_id: number;
  inviter_id: number;
  invited_player_id: number;
  status: InvitationStatus;
  message?: string;
  created_at: string;
  responded_at?: string;
  is_validated_invitation: boolean;
  is_external_request: boolean;
  // Información adicional del endpoint
  inviter_name?: string;
  invited_player_name?: string;
  turn_date?: string;
  turn_start_time?: string;
  turn_court_name?: string;
}

export interface InvitationsResponse {
  success: boolean;
  invitations: Invitation[];
  total_count: number;
}
