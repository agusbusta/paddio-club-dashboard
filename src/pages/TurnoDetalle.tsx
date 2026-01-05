import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import { Autocomplete as MuiAutocomplete } from '@mui/material';
import {
  ArrowBack,
  Edit,
  Cancel,
  Schedule,
  LocationOn,
  Person,
  CalendarToday,
  Add as AddIcon,
  Close as CloseIcon,
  MonetizationOn,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { pregameTurnService } from '../services/pregameTurns';
import { courtService } from '../services/courts';
import { clubService } from '../services/clubs';
import { playerService, Player } from '../services/players';
import { invitationService } from '../services/invitations';
import { notificationService } from '../services/notifications';
import { PregameTurnStatus, PregameTurnUpdate } from '../types/pregameTurn';
import { Invitation, InvitationStatus } from '../types/invitation';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
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
  READY_TO_PLAY: 'Listo para Jugar',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
};

export const TurnoDetalle: React.FC = () => {
  const { turnId } = useParams<{ turnId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState('');
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
  const [removePlayerDialogOpen, setRemovePlayerDialogOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [cancelInvitationsDialogOpen, setCancelInvitationsDialogOpen] = useState(false);
  const [selectedInvitationsToCancel, setSelectedInvitationsToCancel] = useState<number[]>([]);
  const isMountedRef = useRef(true);

  // Debounce para la búsqueda de jugadores
  useEffect(() => {
    if (!addPlayerDialogOpen) {
      setDebouncedSearchQuery('');
      return;
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(playerSearchQuery);
    }, 300); // Esperar 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [playerSearchQuery, addPlayerDialogOpen]);

  // Edición de campos
  const [editedDate, setEditedDate] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedCourtId, setEditedCourtId] = useState<number | null>(null);

  // Detener polling cuando el componente se desmonte
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Obtener turno con polling cada 5 segundos para mantener el estado actualizado
  const { data: turn, isLoading, error } = useQuery({
    queryKey: ['pregameTurn', turnId],
    queryFn: () => pregameTurnService.getPregameTurnById(parseInt(turnId!)),
    enabled: !!turnId,
    refetchInterval: 5000, // Refrescar cada 5 segundos
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recupera el foco
  });

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

  // Obtener jugadores del turno
  const playerIds = [
    turn?.player1_id,
    turn?.player2_id,
    turn?.player3_id,
    turn?.player4_id,
  ].filter(Boolean) as number[];

  const { data: playersData } = useQuery({
    queryKey: ['players', playerIds],
    queryFn: async () => {
      const players = await Promise.all(
        playerIds.map(id => playerService.getPlayerById(id).catch(() => null))
      );
      return players.filter(Boolean) as Player[];
    },
    enabled: playerIds.length > 0 && !!turn && isMountedRef.current,
    refetchInterval: (query) => {
      // Detener polling si el componente está desmontado
      if (!isMountedRef.current) return false;
      return 5000; // Refrescar cada 5 segundos para obtener nombres actualizados
    },
    refetchOnWindowFocus: true,
  });

  // Buscar jugadores para agregar (usando debounced query)
  const { data: searchablePlayers = [], isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['players', 'search', debouncedSearchQuery, turn?.id],
    queryFn: () => playerService.searchPlayers(debouncedSearchQuery || undefined, turn?.id),
    enabled: addPlayerDialogOpen && debouncedSearchQuery.length >= 2,
    staleTime: 30000, // Cache por 30 segundos
  });

  // Obtener invitaciones del turno con polling cada 5 segundos
  const { data: invitationsData } = useQuery({
    queryKey: ['invitations', turn?.id],
    queryFn: () => invitationService.getInvitationsByTurn(turn!.id),
    enabled: !!turn?.id && isMountedRef.current,
    refetchInterval: (query) => {
      // Detener polling si el componente está desmontado
      if (!isMountedRef.current) return false;
      return 5000; // Refrescar cada 5 segundos
    },
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recupera el foco
  });

  // Preparar datos de posiciones con invitaciones (antes de cualquier return)
  const positionsWithInvitations = useMemo(() => {
    if (!turn) return [];
    
    // Mover la inicialización de invitations dentro del useMemo
    const invitations: Invitation[] = invitationsData?.invitations || [];
    
    const assignedPlayerIds = [
      turn.player1_id,
      turn.player2_id,
      turn.player3_id,
      turn.player4_id,
    ].filter(Boolean) as number[];
    
    const pendingInvitations = invitations.filter(inv => 
      inv.status === InvitationStatus.PENDING && 
      !assignedPlayerIds.includes(inv.invited_player_id)
    );
    
    const positions = [
      { id: turn.player1_id, side: turn.player1_side, position: turn.player1_court_position, label: 'Jugador 1' },
      { id: turn.player2_id, side: turn.player2_side, position: turn.player2_court_position, label: 'Jugador 2' },
      { id: turn.player3_id, side: turn.player3_side, position: turn.player3_court_position, label: 'Jugador 3' },
      { id: turn.player4_id, side: turn.player4_side, position: turn.player4_court_position, label: 'Jugador 4' },
    ];
    
    return positions.map((player, idx) => {
      let invitation: Invitation | undefined;
      if (player.id) {
        invitation = invitations.find(inv => inv.invited_player_id === player.id);
      } else {
        // Si no hay jugador, asignar la primera invitación pendiente disponible
        const emptySlotsBefore = positions.slice(0, idx).filter(p => !p.id).length;
        invitation = pendingInvitations[emptySlotsBefore] || undefined;
      }
      
      return { ...player, invitation };
    });
  }, [turn, invitationsData]);

  // Calcular si hay espacios realmente vacíos (sin jugadores y sin invitaciones pendientes)
  const hasEmptySlots = useMemo(() => {
    if (!turn) return false;
    return positionsWithInvitations.some(
      (pos) => !pos.id && !pos.invitation
    );
  }, [positionsWithInvitations, turn]);

  // Calcular si hay invitaciones pendientes
  const hasPendingInvitations = useMemo(() => {
    if (!invitationsData?.invitations) return false;
    return invitationsData.invitations.some(
      (inv) => inv.status === InvitationStatus.PENDING
    );
  }, [invitationsData]);

  // Mutaciones
  const updateTurnMutation = useMutation({
    mutationFn: (data: PregameTurnUpdate) =>
      pregameTurnService.updatePregameTurn(parseInt(turnId!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregameTurn', turnId] });
      queryClient.invalidateQueries({ queryKey: ['pregameTurns'] });
      toast.success('Turno actualizado exitosamente');
      setEditMode(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar el turno');
    },
  });

  const cancelTurnMutation = useMutation({
    mutationFn: (message: string) =>
      pregameTurnService.updatePregameTurn(parseInt(turnId!), {
        status: PregameTurnStatus.CANCELLED,
        cancellation_message: message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregameTurn', turnId] });
      queryClient.invalidateQueries({ queryKey: ['pregameTurns'] });
      toast.success('Turno cancelado exitosamente');
      setCancelDialogOpen(false);
      setCancellationMessage('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al cancelar el turno');
    },
  });

  // Verificar si el usuario es el organizador del turno (player1_id)
  const isOrganizer = useMemo(() => {
    if (!turn || !user) return false;
    return Number(turn.player1_id) === Number(user.id);
  }, [turn, user]);

  // Verificar si el usuario es administrador del club del turno
  const isClubAdmin = useMemo(() => {
    return user?.is_admin && user?.club_id !== undefined;
  }, [user]);

  // Mutación para cancelar invitaciones pendientes
  const cancelInvitationsMutation = useMutation({
    mutationFn: async (invitationIds: number[]) => {
      // Intentar cancelar cada invitación
      const results = await Promise.allSettled(
        invitationIds.map((invId) => invitationService.cancelInvitation(invId))
      );
      
      // Contar éxitos y fallos
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      
      return { successful, failed, total: invitationIds.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', turn?.id] });
      queryClient.invalidateQueries({ queryKey: ['pregameTurn', turnId] });
      setCancelInvitationsDialogOpen(false);
      setSelectedInvitationsToCancel([]);
      
      if (result.failed > 0) {
        toast.success(`${result.successful} invitación(es) cancelada(s). ${result.failed} no se pudieron cancelar.`);
      } else {
        toast.success(`${result.successful} invitación(es) cancelada(s) exitosamente`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al cancelar las invitaciones');
    },
  });

  // Inicializar valores de edición
  React.useEffect(() => {
    if (turn) {
      setEditedDate(turn.date ? format(new Date(turn.date), 'yyyy-MM-dd') : '');
      setEditedStartTime(turn.start_time || '');
      setEditedCourtId(turn.court_id || null);
    }
  }, [turn]);

  // Marcar notificaciones relacionadas con este turno como leídas cuando el usuario ve el turno
  React.useEffect(() => {
    if (!turn?.id) return;

    const markTurnNotificationsAsRead = async () => {
      try {
        // Obtener todas las notificaciones
        const notificationsResponse = await notificationService.getNotifications();
        const notifications = notificationsResponse.notifications || [];

        // Buscar notificaciones no leídas relacionadas con este turno
        const turnNotifications = notifications.filter((notif) => {
          if (notif.is_read) return false;
          // Verificar si la notificación está relacionada con este turno
          // Puede estar en data.turn_id o en el tipo de notificación
          const turnId = notif.data?.turn_id;
          return turnId === turn.id || turnId === turn.turn_id;
        });

        // Marcar cada notificación como leída
        if (turnNotifications.length > 0) {
          await Promise.all(
            turnNotifications.map((notif) => notificationService.markAsRead(notif.id))
          );

          // Invalidar la query de notificaciones para actualizar el badge
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      } catch (error) {
        // Silenciar errores - no es crítico si falla
        console.error('Error marking turn notifications as read:', error);
      }
    };

    // Ejecutar después de un pequeño delay para asegurar que el turno esté cargado
    const timeoutId = setTimeout(markTurnNotificationsAsRead, 500);
    return () => clearTimeout(timeoutId);
  }, [turn?.id, turn?.turn_id, queryClient]);

  if (isLoading) {
    return <LoadingSpinner message="Cargando detalle del turno..." />;
  }

  if (error || !turn) {
    return (
      <ErrorAlert
        title="Error al cargar el turno"
        message="No se pudo cargar el detalle del turno. Por favor, intenta más tarde."
        onRetry={() => navigate('/turnos/calendario')}
      />
    );
  }

  const handleSaveChanges = () => {
    const updates: PregameTurnUpdate = {};

    if (editedDate && editedDate !== (turn.date ? format(new Date(turn.date), 'yyyy-MM-dd') : '')) {
      // El backend espera la fecha en formato ISO
      updates.date = editedDate;
    }

    if (editedStartTime && editedStartTime !== turn.start_time) {
      updates.start_time = editedStartTime;
    }

    if (editedCourtId && editedCourtId !== turn.court_id) {
      updates.selected_court_id = editedCourtId;
    }

    if (Object.keys(updates).length > 0) {
      updateTurnMutation.mutate(updates);
    } else {
      setEditMode(false);
    }
  };

  const handleCancelTurn = () => {
    if (!cancellationMessage.trim()) {
      toast.error('Por favor, ingresa un motivo para la cancelación');
      return;
    }
    cancelTurnMutation.mutate(cancellationMessage);
  };

  const handleAddPlayer = () => {
    if (!selectedPlayer || !turn) return;

    // Encontrar la primera posición vacía
    let updateData: PregameTurnUpdate = {};
    if (!turn.player1_id) {
      updateData.player1_id = selectedPlayer.id;
    } else if (!turn.player2_id) {
      updateData.player2_id = selectedPlayer.id;
    } else if (!turn.player3_id) {
      updateData.player3_id = selectedPlayer.id;
    } else if (!turn.player4_id) {
      updateData.player4_id = selectedPlayer.id;
    } else {
      toast.error('El turno ya está completo');
      return;
    }

    updateTurnMutation.mutate(updateData);
    setAddPlayerDialogOpen(false);
    setSelectedPlayer(null);
    setPlayerSearchQuery('');
  };

  const handleRemovePlayer = () => {
    if (!playerToRemove || !turn) return;

    let updateData: PregameTurnUpdate = {};
    if (turn.player1_id === playerToRemove) {
      updateData.player1_id = null;
      updateData.player1_side = undefined;
      updateData.player1_court_position = undefined;
    } else if (turn.player2_id === playerToRemove) {
      updateData.player2_id = null;
      updateData.player2_side = undefined;
      updateData.player2_court_position = undefined;
    } else if (turn.player3_id === playerToRemove) {
      updateData.player3_id = null;
      updateData.player3_side = undefined;
      updateData.player3_court_position = undefined;
    } else if (turn.player4_id === playerToRemove) {
      updateData.player4_id = null;
      updateData.player4_side = undefined;
      updateData.player4_court_position = undefined;
    }

    updateTurnMutation.mutate(updateData);
    setRemovePlayerDialogOpen(false);
    setPlayerToRemove(null);
  };

  const getPlayerName = (playerId?: number): string => {
    if (!playerId || !playersData) return 'No asignado';
    const player = playersData.find(p => p.id === playerId);
    return player ? `${player.name} ${player.last_name || ''}`.trim() : `Jugador ${playerId}`;
  };

  // Función helper para obtener el nombre de la cancha
  const getCourtName = (): string => {
    if (turn?.court_name) return turn.court_name;
    const court = courts.find((c: any) => c.id === turn?.court_id || c.id === turn?.selected_court_id);
    return court?.name || 'N/A';
  };

  // Función helper para obtener el precio (del turno o del club como fallback)
  const getTurnPrice = (): number | null => {
    if (!turn) return null;
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

  const getInvitationStatusLabel = (invitation: Invitation | undefined): string => {
    if (!invitation) return '';
    
    switch (invitation.status) {
      case InvitationStatus.PENDING:
        return invitation.is_external_request ? 'Solicitud pendiente' : 'Invitación pendiente';
      case InvitationStatus.ACCEPTED:
        return 'Aceptada';
      case InvitationStatus.DECLINED:
        return 'Rechazada';
      case InvitationStatus.EXPIRED:
        return 'Expirada';
      case InvitationStatus.CANCELLED:
        return 'Cancelada';
      default:
        return '';
    }
  };

  const getInvitationStatusColor = (invitation: Invitation | undefined): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (!invitation) return 'default';
    
    switch (invitation.status) {
      case InvitationStatus.PENDING:
        return 'warning';
      case InvitationStatus.ACCEPTED:
        return 'success';
      case InvitationStatus.DECLINED:
      case InvitationStatus.CANCELLED:
      case InvitationStatus.EXPIRED:
        return 'error';
      default:
        return 'default';
    }
  };

  // Función helper para contar jugadores
  const countPlayers = (turn: any): number => {
    if (!turn) return 0;
    let count = 0;
    if (turn.player1_id) count++;
    if (turn.player2_id) count++;
    if (turn.player3_id) count++;
    if (turn.player4_id) count++;
    return count;
  };

  const playersCount = turn ? countPlayers(turn) : 0;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Breadcrumbs items={[
        { label: 'Inicio', path: '/' },
        { label: 'Turnos', path: '/turnos/calendario' },
        { label: `Turno #${turn.id}` },
      ]} />
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate('/turnos/calendario')}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={900} sx={{ color: 'primary.main' }}>
            Detalle del Turno
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: #{turn.id}
          </Typography>
        </Box>
        <Chip
          label={STATUS_LABELS[turn.status]}
          sx={{
            bgcolor: STATUS_COLORS[turn.status],
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Información Principal */}
        <Box sx={{ flex: { md: '2 1 0' } }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Información del Turno
              </Typography>
              {!editMode && turn.status !== PregameTurnStatus.CANCELLED && (
                <Button
                  startIcon={<Edit />}
                  variant="outlined"
                  onClick={() => setEditMode(true)}
                >
                  Editar
                </Button>
              )}
            </Box>

            {editMode ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Fecha"
                  type="date"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Hora de inicio"
                  type="time"
                  value={editedStartTime}
                  onChange={(e) => setEditedStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Cancha</InputLabel>
                  <Select
                    value={editedCourtId || ''}
                    onChange={(e) => setEditedCourtId(e.target.value as number)}
                    label="Cancha"
                  >
                    {courts.map((court: any) => (
                      <MenuItem key={court.id} value={court.id}>
                        {court.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveChanges}
                    disabled={updateTurnMutation.isPending}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditMode(false);
                      // Restaurar valores originales
                      setEditedDate(turn.date ? format(new Date(turn.date), 'yyyy-MM-dd') : '');
                      setEditedStartTime(turn.start_time || '');
                      setEditedCourtId(turn.court_id || null);
                    }}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Fecha
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {turn.date ? format(new Date(turn.date), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Horario
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {turn.start_time} - {turn.end_time}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Cancha
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {getCourtName()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Jugadores
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {playersCount} / 4
                    </Typography>
                  </Box>
                </Box>
                {(() => {
                  const price = getTurnPrice();
                  if (!price) return null;
                  return (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonetizationOn fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Precio Total
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            ${(price / 100).toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonetizationOn fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Precio por Jugador
                          </Typography>
                          <Typography variant="body1" fontWeight={500} sx={{ color: 'primary.main' }}>
                            ${((price / 100) / 4).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  );
                })()}
              </Box>
            )}
          </Paper>

          {/* Jugadores */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Jugadores
              </Typography>
              {turn.status !== PregameTurnStatus.CANCELLED && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {hasPendingInvitations && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      startIcon={<Cancel />}
                      onClick={() => {
                        // Inicializar con todas las invitaciones pendientes seleccionadas
                        const pendingInvitations = invitationsData?.invitations?.filter(
                          (inv) => inv.status === InvitationStatus.PENDING
                        ) || [];
                        setSelectedInvitationsToCancel(pendingInvitations.map(inv => inv.id));
                        setCancelInvitationsDialogOpen(true);
                      }}
                    >
                      Cancelar Invitaciones
                    </Button>
                  )}
                  {hasEmptySlots && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setAddPlayerDialogOpen(true)}
                    >
                      Agregar Jugador
                    </Button>
                  )}
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {positionsWithInvitations.map((player, idx) => {
                const invitation = player.invitation;
                const hasInvitation = !!invitation;
                
                return (
                  <Card variant="outlined" key={idx}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {player.label}
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {getPlayerName(player.id)}
                          </Typography>
                          {player.id && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {player.side && (
                                <Chip
                                  label={player.side === 'drive' ? 'Drive' : 'Revés'}
                                  size="small"
                                  color={player.side === 'drive' ? 'primary' : 'secondary'}
                                />
                              )}
                              {player.position && (
                                <Chip
                                  label={player.position === 'izquierda' ? 'Lado A' : 'Lado B'}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {invitation && (
                                <Chip
                                  label={getInvitationStatusLabel(invitation)}
                                  size="small"
                                  color={getInvitationStatusColor(invitation)}
                                  variant={invitation.status === InvitationStatus.PENDING ? 'filled' : 'outlined'}
                                />
                              )}
                            </Box>
                          )}
                          {!player.id && hasInvitation && invitation && (
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={getInvitationStatusLabel(invitation)}
                                size="small"
                                color={getInvitationStatusColor(invitation)}
                                variant={invitation.status === InvitationStatus.PENDING ? 'filled' : 'outlined'}
                              />
                              {invitation.invited_player_name && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                  {invitation.invited_player_name}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                        {player.id && turn.status !== PregameTurnStatus.CANCELLED && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setPlayerToRemove(player.id!);
                              setRemovePlayerDialogOpen(true);
                            }}
                            sx={{ ml: 1 }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Paper>
        </Box>

        {/* Acciones */}
        <Box sx={{ flex: { md: '1 1 0' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              Acciones
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {turn.status !== PregameTurnStatus.CANCELLED && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => setCancelDialogOpen(true)}
                    fullWidth
                  >
                    Cancelar Turno
                  </Button>
                </>
              )}
              <Button
                variant="outlined"
                onClick={() => navigate('/turnos/calendario')}
                fullWidth
              >
                Volver al Calendario
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Diálogo de cancelación */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancelar Turno</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción cancelará el turno y notificará a todos los jugadores.
          </Alert>
          <TextField
            label="Motivo de cancelación"
            multiline
            rows={4}
            value={cancellationMessage}
            onChange={(e) => setCancellationMessage(e.target.value)}
            fullWidth
            required
            helperText="Por favor, explica el motivo de la cancelación"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelTurn}
            disabled={!cancellationMessage.trim() || cancelTurnMutation.isPending}
          >
            {cancelTurnMutation.isPending ? <CircularProgress size={24} /> : 'Confirmar Cancelación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para cancelar invitaciones */}
      <Dialog 
        open={cancelInvitationsDialogOpen} 
        onClose={() => {
          setCancelInvitationsDialogOpen(false);
          setSelectedInvitationsToCancel([]);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Cancelar Invitaciones
          <IconButton
            aria-label="close"
            onClick={() => {
              setCancelInvitationsDialogOpen(false);
              setSelectedInvitationsToCancel([]);
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body1" gutterBottom>
              Selecciona las invitaciones que deseas cancelar:
            </Typography>
            
            {!isOrganizer && !isClubAdmin && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Solo puedes cancelar las invitaciones que enviaste. Si eres el organizador del turno o el administrador del club, podrás cancelar todas las invitaciones.
              </Alert>
            )}

            {(() => {
              const pendingInvitations = invitationsData?.invitations?.filter(
                (inv) => inv.status === InvitationStatus.PENDING
              ) || [];

              // Si es organizador o administrador del club, puede cancelar todas. Si no, solo las que envió
              const cancellableInvitations = (isOrganizer || isClubAdmin)
                ? pendingInvitations
                : pendingInvitations.filter((inv) => {
                    if (!user?.id || !inv.inviter_id) return false;
                    return Number(inv.inviter_id) === Number(user.id);
                  });

              const allSelected = cancellableInvitations.length > 0 && 
                cancellableInvitations.every((inv) => selectedInvitationsToCancel.includes(inv.id));

              return (
                <>
                  {cancellableInvitations.length > 0 && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allSelected}
                          indeterminate={
                            selectedInvitationsToCancel.length > 0 && 
                            selectedInvitationsToCancel.length < cancellableInvitations.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvitationsToCancel(cancellableInvitations.map(inv => inv.id));
                            } else {
                              setSelectedInvitationsToCancel([]);
                            }
                          }}
                        />
                      }
                      label="Seleccionar todas"
                    />
                  )}

                  <Divider />

                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {cancellableInvitations.map((invitation) => {
                      const playerName = invitation.invited_player_name || `Jugador ${invitation.invited_player_id}`;
                      const isSelected = selectedInvitationsToCancel.includes(invitation.id);
                      
                      return (
                        <ListItem key={invitation.id} disablePadding>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedInvitationsToCancel([...selectedInvitationsToCancel, invitation.id]);
                                  } else {
                                    setSelectedInvitationsToCancel(
                                      selectedInvitationsToCancel.filter(id => id !== invitation.id)
                                    );
                                  }
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {playerName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {invitation.is_external_request ? 'Solicitud externa' : 'Invitación'}
                                </Typography>
                              </Box>
                            }
                            sx={{ width: '100%' }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>

                  {cancellableInvitations.length === 0 && (
                    <Alert severity="info">
                      No hay invitaciones que puedas cancelar.
                    </Alert>
                  )}
                </>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCancelInvitationsDialogOpen(false);
            setSelectedInvitationsToCancel([]);
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              if (selectedInvitationsToCancel.length > 0) {
                cancelInvitationsMutation.mutate(selectedInvitationsToCancel);
              }
            }}
            disabled={selectedInvitationsToCancel.length === 0 || cancelInvitationsMutation.isPending}
          >
            {cancelInvitationsMutation.isPending ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Cancelando...
              </>
            ) : (
              `Cancelar ${selectedInvitationsToCancel.length} invitación(es)`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar jugador */}
      <Dialog open={addPlayerDialogOpen} onClose={() => {
        setAddPlayerDialogOpen(false);
        setSelectedPlayer(null);
        setPlayerSearchQuery('');
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          Agregar Jugador al Turno
          <IconButton
            aria-label="close"
            onClick={() => {
              setAddPlayerDialogOpen(false);
              setSelectedPlayer(null);
              setPlayerSearchQuery('');
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {turn.court_name} - {turn.date && format(new Date(turn.date), 'dd/MM/yyyy')} - {turn.start_time}
            </Typography>
            <MuiAutocomplete
              options={searchablePlayers || []}
              getOptionLabel={(option) => {
                if (!option) return '';
                return `${option.name || ''} ${option.last_name || ''} (${option.email || ''})`.trim() || 'Sin nombre';
              }}
              loading={isLoadingPlayers}
              onInputChange={(_, value) => {
                setPlayerSearchQuery(value);
              }}
              onChange={(_, value) => setSelectedPlayer(value)}
              inputValue={playerSearchQuery}
              value={selectedPlayer}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar jugador"
                  placeholder="Escribe al menos 2 caracteres..."
                  fullWidth
                  error={false}
                  helperText={isLoadingPlayers ? 'Buscando...' : playerSearchQuery.length < 2 ? 'Escribe al menos 2 caracteres para buscar' : ''}
                />
              )}
              noOptionsText={
                isLoadingPlayers 
                  ? 'Buscando...' 
                  : playerSearchQuery.length < 2 
                    ? 'Escribe al menos 2 caracteres...' 
                    : 'No se encontraron jugadores'
              }
              filterOptions={(x) => x} // Deshabilitar filtrado local, usar solo resultados del servidor
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddPlayerDialogOpen(false);
            setSelectedPlayer(null);
            setPlayerSearchQuery('');
          }}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddPlayer}
            variant="contained"
            disabled={!selectedPlayer || updateTurnMutation.isPending}
          >
            {updateTurnMutation.isPending ? 'Agregando...' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para quitar jugador */}
      <Dialog open={removePlayerDialogOpen} onClose={() => {
        setRemovePlayerDialogOpen(false);
        setPlayerToRemove(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Quitar Jugador del Turno</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas quitar a {playerToRemove ? getPlayerName(playerToRemove) : 'este jugador'} del turno?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRemovePlayerDialogOpen(false);
            setPlayerToRemove(null);
          }}>
            Cancelar
          </Button>
          <Button
            onClick={handleRemovePlayer}
            variant="contained"
            color="error"
            disabled={updateTurnMutation.isPending}
          >
            {updateTurnMutation.isPending ? 'Quitando...' : 'Quitar Jugador'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
