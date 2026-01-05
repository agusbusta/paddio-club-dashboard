import { ClubStatistics } from '../types/statistics';
import { courtService } from './courts';
import { pregameTurnService } from './pregameTurns';
import { clubService } from './clubs';

export const statisticsService = {
  // Obtener estadísticas completas del club
  getClubStatistics: async (clubId: number): Promise<ClubStatistics> => {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Obtener datos en paralelo
    // Nota: El endpoint solo acepta una fecha específica, así que obtenemos todos los turnos
    const [courts, todayTurns, allTurns, club] = await Promise.all([
      courtService.getCourts(),
      pregameTurnService.getPregameTurnsForClub(clubId, today),
      pregameTurnService.getPregameTurnsForClub(clubId), // Sin fecha = todos los turnos
      clubService.getClubById(clubId),
    ]);

    // Filtrar canchas del club
    const clubCourts = courts.filter((court: any) => court.club_id === clubId);
    const totalCourts = clubCourts.length;
    const availableCourts = clubCourts.filter((c: any) => c.is_available).length;
    const maintenanceCourts = totalCourts - availableCourts;

    // Estadísticas de turnos del día
    const todayTurnsList = todayTurns.pregame_turns || [];
    const todayStats = {
      total: todayTurnsList.length,
      completed: todayTurnsList.filter((t: any) => t.status === 'COMPLETED').length,
      pending: todayTurnsList.filter((t: any) => t.status === 'PENDING').length,
      available: todayTurnsList.filter((t: any) => t.status === 'AVAILABLE').length,
      readyToPlay: todayTurnsList.filter((t: any) => t.status === 'READY_TO_PLAY').length,
    };

    // Calcular ingresos
    const pricePerTurn = club.price_per_turn || 0;

    // Ingresos del día (solo turnos completados o ready to play)
    const todayRevenue =
      (todayStats.completed + todayStats.readyToPlay) * pricePerTurn;

    // Filtrar turnos del mes desde todos los turnos
    const allTurnsList = allTurns.pregame_turns || [];
    const monthTurnsList = allTurnsList.filter((turn: any) => {
      if (!turn.date) return false;
      const turnDate = turn.date.split('T')[0];
      return turnDate >= startOfMonth;
    });

    // Ingresos del mes
    const completedMonthTurns = monthTurnsList.filter(
      (t: any) => t.status === 'COMPLETED' || t.status === 'READY_TO_PLAY'
    );
    const monthRevenue = completedMonthTurns.length * pricePerTurn;

    // Jugadores únicos del mes
    const uniquePlayerIds = new Set<number>();
    monthTurnsList.forEach((turn: any) => {
      if (turn.player1_id) uniquePlayerIds.add(turn.player1_id);
      if (turn.player2_id) uniquePlayerIds.add(turn.player2_id);
      if (turn.player3_id) uniquePlayerIds.add(turn.player3_id);
      if (turn.player4_id) uniquePlayerIds.add(turn.player4_id);
    });

    // Ocupación por día de la semana (últimas 4 semanas)
    const occupancyByDayOfWeek = calculateOccupancyByDayOfWeek(monthTurnsList);

    // Ingresos por día (últimos 30 días)
    const revenueByDay = calculateRevenueByDay(monthTurnsList, pricePerTurn, thirtyDaysAgo);

    // Cancha más utilizada
    const mostUsedCourt = calculateMostUsedCourt(todayTurnsList, clubCourts);

    // Turnos por estado (usar todos los turnos del mes, no solo los de hoy)
    const turnsByStatus = calculateTurnsByStatus(monthTurnsList);

    // Alertas
    const alerts = generateAlerts(clubCourts, todayTurnsList);

    return {
      totalCourts,
      availableCourts,
      maintenanceCourts,
      todayTurns: todayStats,
      todayRevenue,
      monthRevenue,
      uniquePlayersThisMonth: uniquePlayerIds.size,
      occupancyByDayOfWeek,
      revenueByDay,
      mostUsedCourt,
      turnsByStatus,
      alerts,
    };
  },
};

// Funciones auxiliares
function calculateOccupancyByDayOfWeek(turns: any[]): { day: string; occupancy: number }[] {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const occupancy: { [key: string]: number } = {};

  days.forEach((day) => {
    occupancy[day] = 0;
  });

  turns.forEach((turn) => {
    if (turn.date) {
      const date = new Date(turn.date);
      const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      const dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1]; // Ajustar para que Lunes = 0
      occupancy[dayName] = (occupancy[dayName] || 0) + 1;
    }
  });

  return days.map((day) => ({
    day,
    occupancy: occupancy[day] || 0,
  }));
}

function calculateRevenueByDay(
  turns: any[],
  pricePerTurn: number,
  startDate: string
): { date: string; revenue: number }[] {
  const revenueByDate: { [key: string]: number } = {};

  turns
    .filter((t) => t.status === 'COMPLETED' || t.status === 'READY_TO_PLAY')
    .forEach((turn) => {
      if (turn.date && turn.date >= startDate) {
        const date = turn.date.split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + pricePerTurn;
      }
    });

  // Generar array de los últimos 30 días
  const result: { date: string; revenue: number }[] = [];
  const start = new Date(startDate);
  const end = new Date();

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      revenue: revenueByDate[dateStr] || 0,
    });
  }

  return result;
}

function calculateMostUsedCourt(
  turns: any[],
  courts: any[]
): { courtId: number; courtName: string; turnCount: number } | null {
  const courtUsage: { [key: number]: number } = {};

  turns.forEach((turn) => {
    if (turn.court_id) {
      courtUsage[turn.court_id] = (courtUsage[turn.court_id] || 0) + 1;
    }
  });

  let maxCount = 0;
  let mostUsedCourtId: number | null = null;

  Object.entries(courtUsage).forEach(([courtId, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedCourtId = parseInt(courtId);
    }
  });

  if (mostUsedCourtId) {
    const court = courts.find((c) => c.id === mostUsedCourtId);
    if (court) {
      return {
        courtId: court.id,
        courtName: court.name,
        turnCount: maxCount,
      };
    }
  }

  return null;
}

function calculateTurnsByStatus(turns: any[]): { status: string; count: number }[] {
  const statusCounts: { [key: string]: number } = {};

  turns.forEach((turn) => {
    const status = turn.status || 'UNKNOWN';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));
}

function generateAlerts(courts: any[], turns: any[]): {
  type: 'maintenance' | 'pending_turns' | 'price_change';
  message: string;
  severity: 'warning' | 'info' | 'error';
}[] {
  const alerts: {
    type: 'maintenance' | 'pending_turns' | 'price_change';
    message: string;
    severity: 'warning' | 'info' | 'error';
  }[] = [];

  // Alertas de canchas en mantenimiento
  const maintenanceCourts = courts.filter((c) => !c.is_available);
  if (maintenanceCourts.length > 0) {
    alerts.push({
      type: 'maintenance',
      message: `${maintenanceCourts.length} cancha${maintenanceCourts.length > 1 ? 's' : ''} en mantenimiento`,
      severity: 'warning',
    });
  }

  // Alertas de turnos pendientes cercanos a la fecha
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pendingTurnsNearDate = turns.filter((turn) => {
    if (turn.status !== 'PENDING') return false;
    if (!turn.date) return false;
    const turnDate = new Date(turn.date);
    turnDate.setHours(0, 0, 0, 0);
    return turnDate >= today && turnDate <= tomorrow;
  });

  if (pendingTurnsNearDate.length > 0) {
    alerts.push({
      type: 'pending_turns',
      message: `${pendingTurnsNearDate.length} turno${pendingTurnsNearDate.length > 1 ? 's' : ''} pendiente${pendingTurnsNearDate.length > 1 ? 's' : ''} para hoy o mañana`,
      severity: 'info',
    });
  }

  return alerts;
}
