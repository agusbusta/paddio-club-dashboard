import React, { useState, useRef, useMemo } from 'react';
import { Box, Typography, Paper, Chip, Avatar, Button, Modal, Fade, Backdrop, IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Autocomplete, TextField, MenuItem, Select, CircularProgress, Alert } from '@mui/material';
import { AccessTime, Group, CheckCircle, HourglassEmpty, Close, Delete } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { pregameTurnService } from '../services/pregameTurns';
import { playerService, Player } from '../services/players';
import { PregameTurn, PregameTurnStatus, PregameTurnUpdate } from '../types/pregameTurn';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Interfaces locales para el componente
interface Jugador {
  id: number;
  nombre: string;
  avatar: string;
  ladoCancha: 'izquierda' | 'derecha';
  rol: 'drive' | 'reves';
}

interface Turno {
  id: number;
  pregameTurnId: number; // ID del pregame turn en el backend
  hora: string;
  estado: 'completo' | 'incompleto' | 'libre';
  jugadores: Jugador[];
  alquila: string | null;
  courtName?: string;
}

// Utilidad para mapear PregameTurn a Turno
function mapPregameTurnToTurno(pregameTurn: PregameTurn, playersMap: Map<number, { name: string; last_name?: string }>): Turno {
  const jugadores: Jugador[] = [];
  
  // Mapear jugadores desde player1_id hasta player4_id
  const playerPositions = [
    { id: pregameTurn.player1_id, side: pregameTurn.player1_side, position: pregameTurn.player1_court_position },
    { id: pregameTurn.player2_id, side: pregameTurn.player2_side, position: pregameTurn.player2_court_position },
    { id: pregameTurn.player3_id, side: pregameTurn.player3_side, position: pregameTurn.player3_court_position },
    { id: pregameTurn.player4_id, side: pregameTurn.player4_side, position: pregameTurn.player4_court_position },
  ];

  playerPositions.forEach((player, idx) => {
    if (player.id) {
      const playerInfo = playersMap.get(player.id);
      const fullName = playerInfo 
        ? `${playerInfo.name} ${playerInfo.last_name || ''}`.trim()
        : `Jugador ${player.id}`;
      const avatar = playerInfo?.name?.[0]?.toUpperCase() || '?';
      
      jugadores.push({
        id: player.id,
        nombre: fullName,
        avatar,
        ladoCancha: (player.position as 'izquierda' | 'derecha') || (idx < 2 ? 'izquierda' : 'derecha'),
        rol: (player.side as 'drive' | 'reves') || (idx % 2 === 0 ? 'drive' : 'reves'),
      });
    }
  });

  // Determinar estado basado en el status y número de jugadores
  let estado: 'completo' | 'incompleto' | 'libre';
  if (pregameTurn.status === PregameTurnStatus.READY_TO_PLAY || jugadores.length === 4) {
    estado = 'completo';
  } else if (jugadores.length > 0) {
    estado = 'incompleto';
  } else {
    estado = 'libre';
  }

  // Obtener el nombre del organizador (player1)
  const organizerId = pregameTurn.player1_id;
  const organizer = organizerId ? playersMap.get(organizerId) : null;
  const alquila = organizer ? `${organizer.name} ${organizer.last_name || ''}`.trim() : null;

  return {
    id: parseInt(pregameTurn.start_time.replace(':', ''), 10), // Usar hora como ID temporal
    pregameTurnId: pregameTurn.id,
    hora: pregameTurn.start_time,
    estado,
    jugadores,
    alquila,
    courtName: pregameTurn.court_name,
  };
}


const estadoColor = {
  completo: 'success',
  incompleto: 'warning',
  libre: 'primary',
};

const estadoLabel = {
  completo: 'Completo',
  incompleto: 'Incompleto',
  libre: 'Libre',
};

// Utilidad para obtener el orden correcto de posiciones
const posicionesOrden = [
  { ladoCancha: 'izquierda', rol: 'drive' },
  { ladoCancha: 'izquierda', rol: 'reves' },
  { ladoCancha: 'derecha', rol: 'drive' },
  { ladoCancha: 'derecha', rol: 'reves' },
];

function CanchaPadel3D({ jugadores, hoveredJugador }: { jugadores: Jugador[]; hoveredJugador: string | null }) {
  const colorA = '#0A2239';
  const colorB = '#5BE12C';
  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', my: 3 }}>
      <svg width="320" height="180" viewBox="0 0 320 180">
        <defs>
          <linearGradient id="courtGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e3eaf6" />
            <stop offset="100%" stopColor="#f7fafd" />
          </linearGradient>
        </defs>
        <rect x="20" y="20" width="140" height="140" rx="32" fill={colorA} opacity="0.45" />
        <rect x="160" y="20" width="140" height="140" rx="32" fill={colorB} opacity="0.45" />
        <g>
          <rect x="35" y="28" width="110" height="36" rx="18" fill="#fff" opacity="0.92" />
          <text x="90" y="53" textAnchor="middle" fontSize="18" fill="#0A2239" fontWeight="bold">Lado A</text>
        </g>
        <g>
          <rect x="175" y="28" width="110" height="36" rx="18" fill="#fff" opacity="0.92" />
          <text x="230" y="53" textAnchor="middle" fontSize="18" fill="#0A2239" fontWeight="bold">Lado B</text>
        </g>
        <rect x="20" y="20" width="280" height="140" rx="32" fill="url(#courtGradient)" stroke="#0A2239" strokeWidth="4" filter="url(#shadow)" />
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0A2239" floodOpacity="0.10" />
        </filter>
        <line x1="160" y1="20" x2="160" y2="160" stroke="#0A2239" strokeWidth="2" strokeDasharray="6 4" />
        <rect x="155" y="85" width="10" height="10" fill="#0A2239" rx="2" />
        {jugadores[0] && (
          <g>
            <circle cx="60" cy="120" r="22" fill="#fff" filter="url(#shadow)" />
            <circle
              cx="60" cy="120" r="18"
              fill={jugadores[0].ladoCancha === 'izquierda' ? colorA : colorB}
              stroke="#fff" strokeWidth="3"
              style={hoveredJugador === jugadores[0].nombre ? {
                filter: `drop-shadow(0 0 8px ${jugadores[0].ladoCancha === 'izquierda' ? colorA : colorB}) drop-shadow(0 0 16px ${jugadores[0].ladoCancha === 'izquierda' ? colorA : colorB})`
              } : {}}
            />
            <text x="60" y="126" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="bold">{jugadores[0].avatar}</text>
          </g>
        )}
        {jugadores[1] && (
          <g>
            <circle cx="60" cy="60" r="22" fill="#fff" filter="url(#shadow)" />
            <circle
              cx="60" cy="60" r="18"
              fill={jugadores[1].ladoCancha === 'izquierda' ? colorA : colorB}
              stroke="#fff" strokeWidth="3"
              style={hoveredJugador === jugadores[1].nombre ? {
                filter: `drop-shadow(0 0 8px ${jugadores[1].ladoCancha === 'izquierda' ? colorA : colorB}) drop-shadow(0 0 16px ${jugadores[1].ladoCancha === 'izquierda' ? colorA : colorB})`
              } : {}}
            />
            <text x="60" y="66" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="bold">{jugadores[1].avatar}</text>
          </g>
        )}
        {jugadores[2] && (
          <g>
            <circle cx="260" cy="120" r="22" fill="#fff" filter="url(#shadow)" />
            <circle
              cx="260" cy="120" r="18"
              fill={jugadores[2].ladoCancha === 'izquierda' ? colorA : colorB}
              stroke="#fff" strokeWidth="3"
              style={hoveredJugador === jugadores[2].nombre ? {
                filter: `drop-shadow(0 0 8px ${jugadores[2].ladoCancha === 'izquierda' ? colorA : colorB}) drop-shadow(0 0 16px ${jugadores[2].ladoCancha === 'izquierda' ? colorA : colorB})`
              } : {}}
            />
            <text x="260" y="126" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="bold">{jugadores[2].avatar}</text>
          </g>
        )}
        {jugadores[3] && (
          <g>
            <circle cx="260" cy="60" r="22" fill="#fff" filter="url(#shadow)" />
            <circle
              cx="260" cy="60" r="18"
              fill={jugadores[3].ladoCancha === 'izquierda' ? colorA : colorB}
              stroke="#fff" strokeWidth="3"
              style={hoveredJugador === jugadores[3].nombre ? {
                filter: `drop-shadow(0 0 8px ${jugadores[3].ladoCancha === 'izquierda' ? colorA : colorB}) drop-shadow(0 0 16px ${jugadores[3].ladoCancha === 'izquierda' ? colorA : colorB})`
              } : {}}
            />
            <text x="260" y="66" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="bold">{jugadores[3].avatar}</text>
          </g>
        )}
      </svg>
    </Box>
  );
}

const TurnosDelDiaSection: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Turno | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [turnoToClean, setTurnoToClean] = useState<number | null>(null);
  const [inputOpen, setInputOpen] = useState<{ turnoId: number; idx: number } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [autocompleteValue, setAutocompleteValue] = useState<Player | null>(null);
  const [hoveredJugador, setHoveredJugador] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Obtener turnos del día
  const { data: pregameTurnsData, isLoading, error } = useQuery({
    queryKey: ['pregameTurns', user?.club_id, today],
    queryFn: () => pregameTurnService.getPregameTurnsForClub(user!.club_id!, today),
    enabled: !!user?.club_id,
    refetchOnWindowFocus: false,
  });

  // Buscar jugadores disponibles (para el autocomplete)
  const { data: availablePlayers = [] } = useQuery<Player[]>({
    queryKey: ['players', inputValue, selected?.pregameTurnId],
    queryFn: () => playerService.searchPlayers(inputValue || undefined, selected?.pregameTurnId),
    enabled: !!inputOpen && inputValue.length >= 2,
    staleTime: 30000,
  });

  // Mapear turnos del backend a la estructura del componente
  const turnos: Turno[] = useMemo(() => {
    if (!pregameTurnsData?.pregame_turns) return [];
    
    // Por ahora, usamos solo los IDs. Los nombres se obtendrán cuando se abra el modal
    const playersMap = new Map<number, { name: string; last_name?: string }>();
    
    return (pregameTurnsData.pregame_turns as PregameTurn[])
      .filter((turn: PregameTurn) => turn.status !== PregameTurnStatus.CANCELLED && turn.status !== PregameTurnStatus.COMPLETED)
      .map((turn: PregameTurn) => mapPregameTurnToTurno(turn, playersMap))
      .sort((a: Turno, b: Turno) => a.hora.localeCompare(b.hora));
  }, [pregameTurnsData]);

  const turnoActual = selected ? turnos.find(t => t.id === selected.id) : null;

  // Obtener información detallada del turno seleccionado para tener nombres de jugadores
  const { data: detailedTurn } = useQuery({
    queryKey: ['pregameTurnDetailed', selected?.pregameTurnId],
    queryFn: () => pregameTurnService.getPregameTurnById(selected!.pregameTurnId),
    enabled: !!selected?.pregameTurnId,
    staleTime: 30000,
  });

  // Actualizar turno actual con información detallada si está disponible
  const turnoActualConDetalle = useMemo(() => {
    if (!turnoActual) return null;
    if (!detailedTurn) return turnoActual;

    // Crear mapa de jugadores desde el turno detallado
    const playersMap = new Map<number, { name: string; last_name?: string }>();
    const players = [
      (detailedTurn as any).player1,
      (detailedTurn as any).player2,
      (detailedTurn as any).player3,
      (detailedTurn as any).player4,
    ].filter(Boolean);

    players.forEach((player: any) => {
      if (player?.id) {
        playersMap.set(player.id, {
          name: player.name || 'Sin nombre',
          last_name: player.last_name || '',
        });
      }
    });

    return mapPregameTurnToTurno(detailedTurn as PregameTurn, playersMap);
  }, [turnoActual, detailedTurn]);

  // Mutation para actualizar turno
  const updateTurnMutation = useMutation({
    mutationFn: ({ pregameTurnId, update }: { pregameTurnId: number; update: PregameTurnUpdate }) =>
      pregameTurnService.updatePregameTurn(pregameTurnId, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregameTurns'] });
      toast.success('Turno actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar el turno');
    },
  });

  const handleOpen = (turno: Turno) => {
    setSelected(turno);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setInputOpen(null);
    setInputValue('');
    setAutocompleteValue(null);
  };

  // Eliminar jugador individual
  const handleRemoveJugador = async (turno: Turno, jugadorId: number) => {
    if (!selected || selected.id !== turno.id) return;

    // Determinar qué posición ocupa el jugador
    let playerField: 'player1_id' | 'player2_id' | 'player3_id' | 'player4_id' | null = null;
    if (turno.pregameTurnId && pregameTurnsData?.pregame_turns) {
      const pregameTurn = (pregameTurnsData.pregame_turns as PregameTurn[]).find((t: PregameTurn) => t.id === turno.pregameTurnId);
      if (pregameTurn) {
        if (pregameTurn.player1_id === jugadorId) playerField = 'player1_id';
        else if (pregameTurn.player2_id === jugadorId) playerField = 'player2_id';
        else if (pregameTurn.player3_id === jugadorId) playerField = 'player3_id';
        else if (pregameTurn.player4_id === jugadorId) playerField = 'player4_id';
      }
    }

    if (!playerField) {
      toast.error('No se pudo identificar la posición del jugador');
      return;
    }

    const update: PregameTurnUpdate = {
      [playerField]: null,
      [`${playerField.replace('_id', '')}_side`]: null,
      [`${playerField.replace('_id', '')}_court_position`]: null,
    } as any;

    updateTurnMutation.mutate({ pregameTurnId: turno.pregameTurnId, update });
  };

  // Limpiar turno (quitar todos los jugadores)
  const handleCleanTurno = (turno: Turno) => {
    setTurnoToClean(turno.id);
    setConfirmOpen(true);
  };

  const handleConfirmClean = async () => {
    if (turnoToClean === null) return;
    
    const turno = turnos.find(t => t.id === turnoToClean);
    if (!turno) return;

    const update: PregameTurnUpdate = {
      player1_id: null,
      player2_id: null,
      player3_id: null,
      player4_id: null,
      player1_side: null as any,
      player1_court_position: null as any,
      player2_side: null as any,
      player2_court_position: null as any,
      player3_side: null as any,
      player3_court_position: null as any,
      player4_side: null as any,
      player4_court_position: null as any,
    };

    updateTurnMutation.mutate({ pregameTurnId: turno.pregameTurnId, update });
    setConfirmOpen(false);
    setTurnoToClean(null);
  };

  const handleCancelClean = () => {
    setConfirmOpen(false);
    setTurnoToClean(null);
  };

  // Agregar jugador en la posición idx
  const handleAddJugador = async (turno: Turno, idx: number, player: Player) => {
    if (!selected || selected.id !== turno.id) return;

    // Determinar qué posición corresponde al índice
    const posicion = posicionesOrden[idx];
    const playerField = `player${idx + 1}_id` as 'player1_id' | 'player2_id' | 'player3_id' | 'player4_id';
    const sideField = `player${idx + 1}_side` as 'player1_side' | 'player2_side' | 'player3_side' | 'player4_side';
    const positionField = `player${idx + 1}_court_position` as 'player1_court_position' | 'player2_court_position' | 'player3_court_position' | 'player4_court_position';

    const update: PregameTurnUpdate = {
      [playerField]: player.id,
      [sideField]: posicion.rol,
      [positionField]: posicion.ladoCancha,
    } as any;

    updateTurnMutation.mutate({ pregameTurnId: turno.pregameTurnId, update });
    setInputOpen(null);
    setInputValue('');
    setAutocompleteValue(null);
  };

  // Cambiar lado o rol de un jugador
  const handleChangeLadoORol = async (
    turno: Turno,
    jugadorId: number,
    campo: 'ladoCancha' | 'rol',
    valor: 'izquierda' | 'derecha' | 'drive' | 'reves'
  ) => {
    if (!selected || selected.id !== turno.id) return;

    // Encontrar qué posición ocupa el jugador
    const jugador = turno.jugadores.find(j => j.id === jugadorId);
    if (!jugador) return;

    const jugadorIndex = turno.jugadores.findIndex(j => j.id === jugadorId);
    if (jugadorIndex === -1) return;

    const playerField = `player${jugadorIndex + 1}` as 'player1' | 'player2' | 'player3' | 'player4';
    const sideField = `${playerField}_side` as 'player1_side' | 'player2_side' | 'player3_side' | 'player4_side';
    const positionField = `${playerField}_court_position` as 'player1_court_position' | 'player2_court_position' | 'player3_court_position' | 'player4_court_position';

    const update: PregameTurnUpdate = {
      [sideField]: campo === 'rol' ? valor : jugador.rol,
      [positionField]: campo === 'ladoCancha' ? valor : jugador.ladoCancha,
    } as any;

    updateTurnMutation.mutate({ pregameTurnId: turno.pregameTurnId, update });
  };

  // Mover jugador con drag & drop
  const handleDragEnd = (result: DropResult, turno: Turno) => {
    setDragOverIdx(null);
    const destIdx = result.destination?.index;
    if (typeof destIdx !== 'number' || result.source.index === destIdx) return;

    const sourceJugador = turno.jugadores.find(
      j => j.ladoCancha === posicionesOrden[result.source.index].ladoCancha &&
           j.rol === posicionesOrden[result.source.index].rol
    );

    if (!sourceJugador) return;

    const destinoPos = posicionesOrden[destIdx];
    const jugadorIndex = turno.jugadores.findIndex(j => j.id === sourceJugador.id);
    
    if (jugadorIndex === -1) return;

    const sideField = `player${jugadorIndex + 1}_side` as 'player1_side' | 'player2_side' | 'player3_side' | 'player4_side';
    const positionField = `player${jugadorIndex + 1}_court_position` as 'player1_court_position' | 'player2_court_position' | 'player3_court_position' | 'player4_court_position';

    const update: PregameTurnUpdate = {
      [sideField]: destinoPos.rol,
      [positionField]: destinoPos.ladoCancha,
    } as any;

    updateTurnMutation.mutate({ pregameTurnId: turno.pregameTurnId, update });
  };

  if (!user?.club_id) {
    return (
      <Alert severity="error">
        No tienes un club asignado. Contacta al administrador.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error al cargar los turnos. Por favor, intenta más tarde.
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Typography
        variant="h5"
        fontWeight={900}
        sx={{
          mb: 3,
          color: '#0A2239',
          letterSpacing: '-0.3px',
          fontSize: { xs: '1.5rem', sm: '1.75rem' },
        }}
      >
        Turnos del Día
      </Typography>
      {turnos.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            background: '#ffffff',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Alert
            severity="info"
            icon={<AccessTime sx={{ fontSize: 28 }} />}
            sx={{
              borderRadius: 2,
              background: 'rgba(91, 225, 44, 0.05)',
              border: '1px solid rgba(91, 225, 44, 0.2)',
              '& .MuiAlert-icon': {
                fontSize: 28,
                color: '#5BE12C',
              },
              '& .MuiAlert-message': {
                fontSize: '1rem',
                fontWeight: 500,
                color: '#0A2239',
              },
            }}
          >
            No hay turnos para hoy. Los turnos aparecerán aquí cuando los jugadores los reserven.
          </Alert>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 4 }}>
          {turnos.map((turno) => (
            <Paper
              key={turno.id}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minHeight: 160,
                background: '#ffffff',
                boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                overflow: 'visible',
                border: '2px solid',
                borderColor:
                  turno.estado === 'completo'
                    ? '#5BE12C'
                    : turno.estado === 'incompleto'
                    ? '#FF9800'
                    : 'transparent',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                  borderColor:
                    turno.estado === 'completo'
                      ? '#2E7D32'
                      : turno.estado === 'incompleto'
                      ? '#F57C00'
                      : '#5BE12C',
                },
              }}
              elevation={0}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(91, 225, 44, 0.3)',
                  }}
                >
                  <AccessTime sx={{ color: '#fff', fontSize: 24 }} />
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  sx={{
                    color: '#0A2239',
                    letterSpacing: '-0.3px',
                    fontSize: '1.25rem',
                  }}
                >
                  {turno.hora} hs
                </Typography>
                <Chip
                  label={estadoLabel[turno.estado]}
                  color={estadoColor[turno.estado] as any}
                  size="small"
                  icon={
                    turno.estado === 'completo' ? <CheckCircle sx={{ color: '#5BE12C' }} /> :
                    turno.estado === 'incompleto' ? <HourglassEmpty sx={{ color: '#FFC107' }} /> : 
                    <Group sx={{ color: '#0A2239' }} />
                  }
                  sx={{ 
                    ml: 1, 
                    fontWeight: 700, 
                    bgcolor: turno.estado === 'libre' ? '#0A2239' : undefined, 
                    color: turno.estado === 'libre' ? 'white' : undefined, 
                    px: 1.5, 
                    borderRadius: 2 
                  }}
                />
              </Box>
              {turno.courtName && (
                <Typography variant="body2" color="text.secondary">
                  {turno.courtName}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                {turno.jugadores.length > 0 ? (
                  turno.jugadores.map((j) => (
                    <Box key={j.id} sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: j.ladoCancha === 'izquierda' ? '#0A2239' : '#5BE12C', 
                        width: 36, 
                        height: 36, 
                        fontWeight: 700, 
                        border: '2px solid #fff', 
                        boxShadow: '0 2px 8px rgba(10,34,57,0.10)' 
                      }}>
                        {j.avatar}
                      </Avatar>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">Sin jugadores</Typography>
                )}
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    color: '#0A2239', 
                    borderColor: '#0A2239', 
                    fontWeight: 700, 
                    borderRadius: 3, 
                    px: 2, 
                    py: 1, 
                    background: 'rgba(10,34,57,0.04)', 
                    boxShadow: '0 2px 8px rgba(10,34,57,0.06)', 
                    transition: 'all 0.2s', 
                    '&:hover': { background: 'rgba(10,34,57,0.10)' } 
                  }} 
                  onClick={() => handleOpen(turno)}
                >
                  Ver Detalle
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Confirmación de limpieza */}
      <Dialog open={confirmOpen} onClose={handleCancelClean}>
        <DialogTitle>Limpiar turno</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro que quieres quitar a todos los jugadores de este turno? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClean} color="primary">Cancelar</Button>
          <Button onClick={handleConfirmClean} color="error" variant="contained" disabled={updateTurnMutation.isPending}>
            {updateTurnMutation.isPending ? 'Limpiando...' : 'Limpiar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de detalle del turno */}
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 300 } }}
      >
        <Fade in={open}>
          <Box 
            ref={modalRef} 
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: '#fff',
              boxShadow: '0 16px 48px rgba(10,34,57,0.18)',
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              minWidth: 340,
              maxWidth: 420,
              outline: 'none',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight={900} sx={{ color: '#0A2239', letterSpacing: '-1px' }}>
                Detalle del Turno
              </Typography>
              <IconButton onClick={handleClose} sx={{ color: '#0A2239', transition: 'color 0.2s', '&:hover': { color: '#5BE12C' } }}>
                <Close />
              </IconButton>
            </Box>
            {(turnoActualConDetalle || turnoActual) && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccessTime sx={{ color: '#0A2239', fontSize: 22 }} />
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#0A2239', fontSize: 22 }}>
                    {(turnoActualConDetalle || turnoActual)!.hora} hs
                  </Typography>
                  <Chip
                    label={estadoLabel[(turnoActualConDetalle || turnoActual)!.estado]}
                    color={estadoColor[(turnoActualConDetalle || turnoActual)!.estado] as any}
                    size="small"
                    icon={
                      (turnoActualConDetalle || turnoActual)!.estado === 'completo' ? <CheckCircle sx={{ color: '#5BE12C' }} /> :
                      (turnoActualConDetalle || turnoActual)!.estado === 'incompleto' ? <HourglassEmpty sx={{ color: '#FFC107' }} /> : 
                      <Group sx={{ color: '#0A2239' }} />
                    }
                    sx={{ 
                      ml: 1, 
                      fontWeight: 700, 
                      bgcolor: (turnoActualConDetalle || turnoActual)!.estado === 'libre' ? '#0A2239' : undefined, 
                      color: (turnoActualConDetalle || turnoActual)!.estado === 'libre' ? 'white' : undefined, 
                      px: 1.5, 
                      borderRadius: 2 
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {(turnoActualConDetalle || turnoActual)!.estado === 'completo' && (turnoActualConDetalle || turnoActual)!.alquila && (
                    <>Alquila: <b>{(turnoActualConDetalle || turnoActual)!.alquila}</b></>
                  )}
                  {(turnoActualConDetalle || turnoActual)!.estado === 'incompleto' && (
                    <>
                      {(turnoActualConDetalle || turnoActual)!.alquila && <>Alquila: <b>{(turnoActualConDetalle || turnoActual)!.alquila}</b> — </>}
                      Faltan <b>{4 - (turnoActualConDetalle || turnoActual)!.jugadores.length}</b> jugadores
                    </>
                  )}
                  {(turnoActualConDetalle || turnoActual)!.estado === 'libre' && (
                    <>Turno disponible para reservar</>
                  )}
                </Typography>
                <Divider sx={{ my: 2, borderColor: '#e3eaf6' }} />
                <CanchaPadel3D jugadores={(turnoActualConDetalle || turnoActual)!.jugadores} hoveredJugador={hoveredJugador} />
                <Divider sx={{ my: 2, borderColor: '#e3eaf6' }} />
                <DragDropContext
                  onDragUpdate={update => {
                    setDragOverIdx(update.destination?.index ?? null);
                  }}
                  onDragEnd={result => {
                    if (turnoActual) {
                      handleDragEnd(result, turnoActual);
                    }
                  }}
                >
                  <Droppable droppableId={`turno-${turnoActual!.id}-slots`}>
                    {(provided) => (
                      <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        {posicionesOrden.map((pos, idx) => {
                          const jugador = (turnoActualConDetalle || turnoActual)!.jugadores.find(j => j.ladoCancha === pos.ladoCancha && j.rol === pos.rol);
                          return (
                            <Draggable 
                              key={jugador ? jugador.id : `slot-${pos.ladoCancha}-${pos.rol}`} 
                              draggableId={jugador ? `jugador-${jugador.id}` : `slot-${pos.ladoCancha}-${pos.rol}`} 
                              index={idx} 
                              isDragDisabled={!jugador}
                            >
                              {(provided, snapshot) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1, 
                                    mb: 0.5,
                                    background: dragOverIdx === idx ? 'rgba(90,225,44,0.12)' : 'transparent',
                                    borderRadius: 2,
                                    boxShadow: snapshot.isDragging ? '0 4px 16px rgba(10,34,57,0.10)' : 'none',
                                    cursor: jugador ? 'grab' : 'default',
                                    opacity: jugador ? 1 : 0.7,
                                    transition: 'background 0.2s, box-shadow 0.2s',
                                    border: dragOverIdx === idx ? '2px solid #5BE12C' : '2px solid transparent',
                                  }}
                                  onMouseEnter={() => jugador && setHoveredJugador(jugador.nombre)}
                                  onMouseLeave={() => setHoveredJugador(null)}
                                >
                                  {jugador ? (
                                    <>
                                      <Avatar sx={{ 
                                        bgcolor: jugador.ladoCancha === 'izquierda' ? '#0A2239' : '#5BE12C', 
                                        width: 32, 
                                        height: 32, 
                                        fontWeight: 700, 
                                        border: '2px solid #fff', 
                                        boxShadow: '0 2px 8px rgba(10,34,57,0.10)', 
                                        cursor: 'pointer' 
                                      }}>
                                        {jugador.avatar}
                                      </Avatar>
                                      <Typography variant="body2" fontWeight={700} sx={{ color: '#0A2239' }}>
                                        {jugador.nombre}
                                      </Typography>
                                      <Select
                                        value={jugador.rol}
                                        size="small"
                                        onChange={e => handleChangeLadoORol(turnoActual!, jugador.id, 'rol', e.target.value as 'drive' | 'reves')}
                                        disabled={updateTurnMutation.isPending}
                                        sx={{
                                          bgcolor: jugador.rol === 'drive' ? '#0A2239' : '#5BE12C',
                                          color: 'white',
                                          fontWeight: 700,
                                          fontSize: 13,
                                          px: 1.2,
                                          borderRadius: 2,
                                          height: 32,
                                          minWidth: 80,
                                          boxShadow: 'none',
                                          '.MuiOutlinedInput-notchedOutline': { border: 0 },
                                          '& .MuiSelect-icon': { color: 'white' },
                                        }}
                                      >
                                        <MenuItem value="drive">Drive</MenuItem>
                                        <MenuItem value="reves">Revés</MenuItem>
                                      </Select>
                                      <Select
                                        value={jugador.ladoCancha}
                                        size="small"
                                        onChange={e => handleChangeLadoORol(turnoActual!, jugador.id, 'ladoCancha', e.target.value as 'izquierda' | 'derecha')}
                                        disabled={updateTurnMutation.isPending}
                                        sx={{
                                          bgcolor: jugador.ladoCancha === 'izquierda' ? '#e3eaf6' : '#e6fae3',
                                          color: '#0A2239',
                                          fontWeight: 700,
                                          fontSize: 13,
                                          px: 1.2,
                                          borderRadius: 2,
                                          height: 32,
                                          minWidth: 90,
                                          opacity: 0.85,
                                          boxShadow: 'none',
                                          '.MuiOutlinedInput-notchedOutline': { border: 0 },
                                          '& .MuiSelect-icon': { color: '#0A2239' },
                                        }}
                                      >
                                        <MenuItem 
                                          value="izquierda" 
                                          disabled={(turnoActualConDetalle || turnoActual)!.jugadores.filter(j => j.ladoCancha === 'izquierda').length >= 2 && jugador.ladoCancha !== 'izquierda'}
                                        >
                                          Lado A
                                        </MenuItem>
                                        <MenuItem 
                                          value="derecha" 
                                          disabled={(turnoActualConDetalle || turnoActual)!.jugadores.filter(j => j.ladoCancha === 'derecha').length >= 2 && jugador.ladoCancha !== 'derecha'}
                                        >
                                          Lado B
                                        </MenuItem>
                                      </Select>
                                      <IconButton 
                                        size="small" 
                                        sx={{ ml: 'auto', color: '#f44336', '&:hover': { bgcolor: '#f44336', color: '#fff' } }} 
                                        onClick={() => handleRemoveJugador(turnoActual!, jugador.id)}
                                        disabled={updateTurnMutation.isPending}
                                      >
                                        <Close fontSize="small" />
                                      </IconButton>
                                    </>
                                  ) : (
                                    <Box
                                      sx={{
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1, 
                                        mb: 0.5,
                                        background: dragOverIdx === idx ? 'rgba(90,225,44,0.12)' : 'transparent',
                                        borderRadius: 2,
                                        border: dragOverIdx === idx ? '2px solid #5BE12C' : '2px solid transparent',
                                        transition: 'background 0.2s, box-shadow 0.2s',
                                      }}
                                    >
                                      {inputOpen && inputOpen.turnoId === turnoActual!.id && inputOpen.idx === idx ? (
                                        <Autocomplete
                                          size="small"
                                          options={availablePlayers}
                                          getOptionLabel={(option) => `${option.name} ${option.last_name || ''}`.trim()}
                                          inputValue={inputValue}
                                          value={autocompleteValue}
                                          onInputChange={(_, value) => setInputValue(value)}
                                          onChange={(_, value) => {
                                            if (value && turnoActual) {
                                              handleAddJugador(turnoActual, idx, value);
                                            }
                                          }}
                                          isOptionEqualToValue={(option, value) => option.id === value.id}
                                          loading={!availablePlayers.length && inputValue.length >= 2}
                                          renderInput={(params) => (
                                            <TextField 
                                              {...params} 
                                              label="Buscar jugador" 
                                              autoFocus 
                                              onBlur={() => {
                                                // No cerrar inmediatamente para permitir selección
                                                setTimeout(() => {
                                                  if (!autocompleteValue) {
                                                    setInputOpen(null);
                                                    setInputValue('');
                                                  }
                                                }, 200);
                                              }} 
                                            />
                                          )}
                                          sx={{ minWidth: 220 }}
                                        />
                                      ) : (
                                        <>
                                          <Avatar 
                                            sx={{ 
                                              bgcolor: 'grey.200', 
                                              width: 32, 
                                              height: 32, 
                                              fontWeight: 700, 
                                              color: '#0A2239', 
                                              cursor: 'pointer' 
                                            }} 
                                            onClick={() => turnoActual && setInputOpen({ turnoId: turnoActual.id, idx })}
                                          >
                                            ?
                                          </Avatar>
                                          <Typography 
                                            variant="body2" 
                                            color="text.secondary" 
                                            sx={{ cursor: 'pointer' }} 
                                            onClick={() => turnoActual && setInputOpen({ turnoId: turnoActual.id, idx })}
                                          >
                                            Lugar disponible
                                          </Typography>
                                        </>
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>
                {(turnoActualConDetalle || turnoActual)!.jugadores.length > 0 && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small" 
                      startIcon={<Delete />}
                      onClick={() => handleCleanTurno(turnoActual!)}
                      disabled={updateTurnMutation.isPending}
                      sx={{ borderRadius: 3, px: 2, py: 1, fontWeight: 700 }}
                    >
                      Limpiar turno
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default TurnosDelDiaSection;
