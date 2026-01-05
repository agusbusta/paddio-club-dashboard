export interface ClubStatistics {
  // Estadísticas de canchas
  totalCourts: number;
  availableCourts: number;
  maintenanceCourts: number;

  // Estadísticas de turnos del día
  todayTurns: {
    total: number;
    completed: number;
    pending: number;
    available: number;
    readyToPlay: number;
  };

  // Ingresos
  todayRevenue: number; // En centavos
  monthRevenue: number; // En centavos

  // Jugadores
  uniquePlayersThisMonth: number;

  // Ocupación por día de la semana (últimas 4 semanas)
  occupancyByDayOfWeek: {
    day: string;
    occupancy: number;
  }[];

  // Ingresos por día (últimos 30 días)
  revenueByDay: {
    date: string;
    revenue: number; // En centavos
  }[];

  // Cancha más utilizada
  mostUsedCourt: {
    courtId: number;
    courtName: string;
    turnCount: number;
  } | null;

  // Turnos por estado
  turnsByStatus: {
    status: string;
    count: number;
  }[];

  // Alertas
  alerts: {
    type: 'maintenance' | 'pending_turns' | 'price_change';
    message: string;
    severity: 'warning' | 'info' | 'error';
  }[];
}
