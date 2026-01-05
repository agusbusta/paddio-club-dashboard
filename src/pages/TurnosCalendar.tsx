import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Visibility,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { pregameTurnService } from '../services/pregameTurns';
import { courtService } from '../services/courts';
import { clubService } from '../services/clubs';
import { PregameTurn, PregameTurnStatus } from '../types/pregameTurn';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_COLORS: { [key in PregameTurnStatus]: string } = {
  AVAILABLE: '#5BE12C',
  PENDING: '#FFA500',
  READY_TO_PLAY: '#4ECDC4',
  CANCELLED: '#FF6B6B',
  COMPLETED: '#0A2239',
};

const STATUS_LABELS: { [key in PregameTurnStatus]: string } = {
  AVAILABLE: 'Disponible',
  PENDING: 'Pendiente',
  READY_TO_PLAY: 'Listo',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
};

export const TurnosCalendar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTurn, setSelectedTurn] = useState<PregameTurn | null>(null);
  const [filterCourt, setFilterCourt] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<PregameTurnStatus | 'all'>('all');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Obtener canchas
  const { data: courts = [] } = useQuery({
    queryKey: ['courts', user?.club_id],
    queryFn: () => courtService.getCourts(),
    enabled: !!user?.club_id,
    select: (data) => {
      if (!user?.club_id) return [];
      return data.filter((court: any) => court.club_id === user.club_id);
    },
  });

  // Obtener información del club para el precio
  const { data: club } = useQuery({
    queryKey: ['club', user?.club_id],
    queryFn: () => {
      if (!user?.club_id) throw new Error('No tienes un club asignado');
      return clubService.getClubById(user.club_id);
    },
    enabled: !!user?.club_id,
  });

  // Obtener turnos del mes (sin filtro de fecha para obtener todos)
  const { data: turnsData, isLoading } = useQuery({
    queryKey: ['pregameTurns', user?.club_id, monthStart.toISOString()],
    queryFn: () => {
      if (!user?.club_id) throw new Error('No tienes un club asignado');
      return pregameTurnService.getPregameTurnsForClub(user.club_id);
    },
    enabled: !!user?.club_id,
  });

  // Filtrar turnos del mes actual
  const monthTurns = useMemo(() => {
    if (!turnsData?.pregame_turns) return [];
    return turnsData.pregame_turns.filter((turn: PregameTurn) => {
      if (!turn.date) return false;
      const turnDate = new Date(turn.date);
      return isSameMonth(turnDate, currentDate);
    });
  }, [turnsData, currentDate]);

  // Filtrar por cancha y estado (excluir cancelados por defecto)
  const filteredTurns = useMemo(() => {
    return monthTurns.filter((turn: PregameTurn) => {
      // No mostrar turnos cancelados en el calendario
      if (turn.status === PregameTurnStatus.CANCELLED) return false;
      if (filterCourt !== 'all' && turn.court_id !== filterCourt) return false;
      if (filterStatus !== 'all' && turn.status !== filterStatus) return false;
      return true;
    });
  }, [monthTurns, filterCourt, filterStatus]);

  // Agrupar turnos por fecha
  const turnsByDate = useMemo(() => {
    const grouped: { [key: string]: PregameTurn[] } = {};
    filteredTurns.forEach((turn: PregameTurn) => {
      if (!turn.date) return;
      const dateKey = turn.date.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(turn);
    });
    return grouped;
  }, [filteredTurns]);
  // Generar días del mes
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const turnsForDate = turnsByDate[dateKey] || [];
    if (turnsForDate.length > 0) {
      if (turnsForDate.length === 1) {
        setSelectedTurn(turnsForDate[0]);
      }
    }
  };

  const getTurnsForDate = (date: Date): PregameTurn[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return turnsByDate[dateKey] || [];
  };

  // Función helper para contar jugadores
  const countPlayers = (turn: PregameTurn): number => {
    let count = 0;
    if (turn.player1_id) count++;
    if (turn.player2_id) count++;
    if (turn.player3_id) count++;
    if (turn.player4_id) count++;
    return count;
  };

  // Función helper para obtener el nombre de la cancha
  const getCourtName = (turn: PregameTurn): string => {
    if (turn.court_name) return turn.court_name;
    const court = courts.find((c: any) => c.id === turn.court_id || c.id === turn.selected_court_id);
    return court?.name || 'N/A';
  };

  // Función helper para obtener el precio (del turno o del club como fallback)
  const getTurnPrice = (turn: PregameTurn): number | null => {
    // Si el turno tiene precio, usarlo
    if (turn.price && turn.price > 0) {
      return turn.price;
    }
    // Si no, usar el precio del club (en centavos)
    if (club?.price_per_turn && club.price_per_turn > 0) {
      return club.price_per_turn;
    }
    return null;
  };

  const getDayColor = (date: Date): string => {
    const turns = getTurnsForDate(date);
    if (turns.length === 0) return 'transparent';
    
    const hasReady = turns.some(t => t.status === PregameTurnStatus.READY_TO_PLAY);
    const hasPending = turns.some(t => t.status === PregameTurnStatus.PENDING);
    const hasCompleted = turns.some(t => t.status === PregameTurnStatus.COMPLETED);
    
    if (hasReady) return STATUS_COLORS[PregameTurnStatus.READY_TO_PLAY];
    if (hasPending) return STATUS_COLORS[PregameTurnStatus.PENDING];
    if (hasCompleted) return STATUS_COLORS[PregameTurnStatus.COMPLETED];
    return STATUS_COLORS[PregameTurnStatus.AVAILABLE];
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs items={[
        { label: 'Inicio', path: '/' },
        { label: 'Turnos', path: '/turnos' },
        { label: 'Calendario' },
      ]} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            color: '#0A2239',
            letterSpacing: '-0.5px',
            fontSize: { xs: '1.75rem', sm: '2.5rem' },
          }}
        >
          Calendario de Turnos
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <FormControl
            size="small"
            sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#5BE12C',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#5BE12C',
                },
              },
            }}
          >
            <InputLabel>Cancha</InputLabel>
            <Select
              value={filterCourt}
              label="Cancha"
              onChange={(e) => setFilterCourt(e.target.value as number | 'all')}
            >
              <MenuItem value="all">Todas</MenuItem>
              {courts.map((court: any) => (
                <MenuItem key={court.id} value={court.id}>
                  {court.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            size="small"
            sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#5BE12C',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#5BE12C',
                },
              },
            }}
          >
            <InputLabel>Estado</InputLabel>
            <Select
              value={filterStatus}
              label="Estado"
              onChange={(e) => setFilterStatus(e.target.value as PregameTurnStatus | 'all')}
            >
              <MenuItem value="all">Todos</MenuItem>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <MenuItem key={status} value={status}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Navegación del mes */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: '#ffffff',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          borderRadius: 3,
        }}
        elevation={0}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton
            onClick={handlePreviousMonth}
            sx={{
              color: '#0A2239',
              '&:hover': {
                background: 'rgba(91, 225, 44, 0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="h5"
            fontWeight={900}
            sx={{
              color: '#0A2239',
              letterSpacing: '-0.3px',
              fontSize: '1.5rem',
              textTransform: 'capitalize',
            }}
          >
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </Typography>
          <IconButton
            onClick={handleNextMonth}
            sx={{
              color: '#0A2239',
              '&:hover': {
                background: 'rgba(91, 225, 44, 0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Paper>

      {/* Calendario */}
      <Paper
        sx={{
          p: 3,
          background: '#ffffff',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          borderRadius: 3,
        }}
        elevation={0}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1.5,
          }}
        >
          {/* Días de la semana */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <Typography
              key={day}
              variant="body2"
              fontWeight={900}
              sx={{
                textAlign: 'center',
                p: 1.5,
                color: '#5D6D7E',
                fontSize: '0.875rem',
              }}
            >
              {day}
            </Typography>
          ))}

          {/* Días del mes */}
          {days.map((day) => {
            const turns = getTurnsForDate(day);
            const isToday = isSameDay(day, new Date());
            const dayColor = getDayColor(day);

            return (
              <Box
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                sx={{
                  minHeight: 120,
                  border: isToday ? '2px solid' : '1px solid',
                  borderColor: isToday ? '#5BE12C' : 'rgba(0, 0, 0, 0.08)',
                  borderRadius: 2,
                  p: 1.5,
                  cursor: turns.length > 0 ? 'pointer' : 'default',
                  backgroundColor:
                    dayColor !== 'transparent'
                      ? `${dayColor}15`
                      : isToday
                      ? 'rgba(91, 225, 44, 0.05)'
                      : 'transparent',
                  position: 'relative',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor:
                      turns.length > 0
                        ? `${dayColor}25`
                        : isToday
                        ? 'rgba(91, 225, 44, 0.1)'
                        : 'rgba(0, 0, 0, 0.03)',
                    transform: turns.length > 0 ? 'translateY(-2px)' : 'none',
                    boxShadow: turns.length > 0 ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={isToday ? 900 : 600}
                  sx={{
                    mb: 0.5,
                    color: isToday ? '#5BE12C' : '#0A2239',
                    fontSize: '0.875rem',
                  }}
                >
                  {format(day, 'd')}
                </Typography>
                {turns.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {turns.slice(0, 2).map((turn) => (
                      <Chip
                        key={turn.id}
                        label={`${turn.start_time} - ${getCourtName(turn)}`}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          height: 20,
                          backgroundColor: STATUS_COLORS[turn.status],
                          color: 'white',
                        }}
                      />
                    ))}
                    {turns.length > 2 && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        +{turns.length - 2} más
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Leyenda */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          background: '#ffffff',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          borderRadius: 3,
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <Box
            key={status}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1.5,
                backgroundColor: STATUS_COLORS[status as PregameTurnStatus],
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: '#0A2239',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Diálogo de detalles */}
      <Dialog
        open={selectedTurn !== null}
        onClose={() => setSelectedTurn(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedTurn && (
          <>
            <DialogTitle>
              Detalles del Turno - {selectedTurn.date && format(new Date(selectedTurn.date), 'dd/MM/yyyy')}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Horario
                  </Typography>
                  <Typography variant="body1">
                    {selectedTurn.start_time} - {selectedTurn.end_time}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cancha
                  </Typography>
                  <Typography variant="body1">{getCourtName(selectedTurn)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={STATUS_LABELS[selectedTurn.status]}
                    sx={{
                      backgroundColor: STATUS_COLORS[selectedTurn.status],
                      color: 'white',
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Jugadores
                  </Typography>
                  <Typography variant="body1">
                    {countPlayers(selectedTurn)} / 4
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Precio Total
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {(() => {
                      const price = getTurnPrice(selectedTurn);
                      return price 
                        ? `$${(price / 100).toLocaleString('es-AR')}`
                        : 'No disponible';
                    })()}
                  </Typography>
                </Box>
                {(() => {
                  const price = getTurnPrice(selectedTurn);
                  return price ? (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Precio por Jugador
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: 'primary.main' }}>
                        ${((price / 100) / 4).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                  ) : null;
                })()}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
              <Button
                onClick={() => setSelectedTurn(null)}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  borderColor: '#5D6D7E',
                  color: '#0A2239',
                  '&:hover': {
                    borderColor: '#5BE12C',
                    background: 'rgba(91, 225, 44, 0.05)',
                  },
                }}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  if (selectedTurn) {
                    navigate(`/turnos/${selectedTurn.id}`);
                  }
                }}
                variant="contained"
                startIcon={<Visibility />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
                  boxShadow: '0 4px 12px rgba(91, 225, 44, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                    boxShadow: '0 6px 20px rgba(91, 225, 44, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Ver Detalle Completo
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
