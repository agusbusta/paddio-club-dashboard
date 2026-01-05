import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Autocomplete as MuiAutocomplete,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pregameTurnService } from '../services/pregameTurns';
import { courtService } from '../services/courts';
import { playerService, Player } from '../services/players';
import { DatePicker } from '../components/common/DatePicker';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { toast } from 'react-hot-toast';

export const TurnosCrear: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados del formulario
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [organizerPlayer, setOrganizerPlayer] = useState<Player | null>(null);
  const [organizerSearchQuery, setOrganizerSearchQuery] = useState('');
  const [playerSide, setPlayerSide] = useState<string>('');
  const [playerPosition, setPlayerPosition] = useState<string>('');
  const [categoryRestricted, setCategoryRestricted] = useState(false);
  const [categoryRestrictionType, setCategoryRestrictionType] = useState<string>('NONE');
  const [isMixedMatch, setIsMixedMatch] = useState(false);
  const [freeCategory, setFreeCategory] = useState<string>('');

  // Obtener canchas del club
  const { data: courts = [] } = useQuery({
    queryKey: ['courts', user?.club_id],
    queryFn: () => courtService.getCourts(),
    enabled: !!user?.club_id,
    select: (data) => {
      if (!user?.club_id) return [];
      return data.filter((court: any) => court.club_id === user.club_id && court.is_available);
    },
  });

  // Obtener el template de turnos del club
  const { data: turnsTemplate = [] } = useQuery({
    queryKey: ['turns', user?.club_id],
    queryFn: async () => {
      if (!user?.club_id) throw new Error('No tienes un club asignado');
      const { api } = await import('../services/api');
      const response = await api.get(`/turns?club_id=${user.club_id}`);
      return response.data;
    },
    enabled: !!user?.club_id,
  });

  // Extraer horarios únicos del template del club
  const availableTimes = useMemo((): string[] => {
    if (!turnsTemplate || !Array.isArray(turnsTemplate) || turnsTemplate.length === 0) return [];
    const template = turnsTemplate[0] as any;
    if (!template?.turns_data?.turns) return [];
    // Obtener horarios únicos del template
    const times = (template.turns_data.turns as any[]).map((turn: any) => turn.start_time as string);
    const uniqueTimes = Array.from(new Set(times));
    return uniqueTimes.sort();
  }, [turnsTemplate]);

  // Buscar jugador organizador (solo con token FCM activo)
  const { data: searchablePlayers = [], isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['players', 'search', organizerSearchQuery],
    queryFn: () => playerService.searchPlayers(organizerSearchQuery || undefined),
    enabled: organizerSearchQuery.length >= 2,
    staleTime: 30000,
  });

  // Mutación para crear el turno
  const createTurnMutation = useMutation({
    mutationFn: (params: {
      club_id: number;
      start_time: string;
      target_date: string;
      court_id: number;
      organizer_player_id: number;
      player_side?: string;
      player_position?: string;
      category_restricted?: boolean;
      category_restriction_type?: string;
      is_mixed_match?: boolean;
      free_category?: string;
    }) => pregameTurnService.createTurnByClub(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pregameTurns'] });
      queryClient.invalidateQueries({ queryKey: ['pregameTurn', data.turn_id] });
      toast.success('Turno creado exitosamente');
      navigate(`/turnos/${data.turn_id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear el turno');
    },
  });

  // Validar formulario
  const isFormValid = useMemo(() => {
    return !!(
      selectedDate &&
      selectedStartTime &&
      selectedCourtId &&
      organizerPlayer
    );
  }, [selectedDate, selectedStartTime, selectedCourtId, organizerPlayer]);

  // Validar partido mixto
  const isMixedMatchValid = useMemo(() => {
    if (!isMixedMatch) return true;
    if (!organizerPlayer?.gender) return false;
    if (organizerPlayer.gender === 'Femenino' && !freeCategory) return false;
    return true;
  }, [isMixedMatch, organizerPlayer, freeCategory]);

  // Validar restricciones de categoría
  const isCategoryRestrictionValid = useMemo(() => {
    if (!categoryRestricted) return true;
    return categoryRestrictionType !== 'NONE';
  }, [categoryRestricted, categoryRestrictionType]);

  const handleSubmit = () => {
    if (!isFormValid || !user?.club_id) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    if (!isMixedMatchValid) {
      toast.error('Para partidos mixtos, el organizador debe tener género asignado y, si es mujer, debe especificar la categoría libre');
      return;
    }

    if (!isCategoryRestrictionValid) {
      toast.error('Si activas restricciones de categoría, debes seleccionar un tipo de restricción');
      return;
    }

    createTurnMutation.mutate({
      club_id: user.club_id,
      start_time: selectedStartTime!,
      target_date: selectedDate!,
      court_id: selectedCourtId!,
      organizer_player_id: organizerPlayer!.id,
      player_side: playerSide || undefined,
      player_position: playerPosition || undefined,
      category_restricted: categoryRestricted || undefined,
      category_restriction_type: categoryRestricted ? categoryRestrictionType : undefined,
      is_mixed_match: isMixedMatch || undefined,
      free_category: isMixedMatch ? freeCategory : undefined,
    });
  };

  // Categorías disponibles
  const categories = ['9na', '8va', '7ma', '6ta', '5ta', '4ta', '3ra', '2da', '1ra'];

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/' },
          { label: 'Turnos', path: '/turnos' },
          { label: 'Crear Turno', path: '/turnos/crear' },
        ]}
      />
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Crear Nuevo Turno
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Fecha */}
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            label="Fecha del Turno"
            minDate={new Date()}
          />

          {/* Hora de inicio */}
          <FormControl fullWidth>
            <InputLabel>Hora de Inicio</InputLabel>
            <Select
              value={selectedStartTime || ''}
              onChange={(e) => setSelectedStartTime(e.target.value)}
              label="Hora de Inicio"
            >
              {availableTimes.map((time: string) => (
                <MenuItem key={time} value={time}>
                  {time}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Cancha */}
          <FormControl fullWidth>
            <InputLabel>Cancha</InputLabel>
            <Select
              value={selectedCourtId || ''}
              onChange={(e) => setSelectedCourtId(Number(e.target.value))}
              label="Cancha"
            >
              {courts.map((court: any) => (
                <MenuItem key={court.id} value={court.id}>
                  {court.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Jugador Organizador */}
          <MuiAutocomplete
            options={searchablePlayers || []}
            getOptionLabel={(option) => {
              if (!option) return '';
              return `${option.name || ''} ${option.last_name || ''} (${option.email || ''})`.trim() || 'Sin nombre';
            }}
            loading={isLoadingPlayers}
            onInputChange={(_, value) => {
              setOrganizerSearchQuery(value);
            }}
            onChange={(_, value) => setOrganizerPlayer(value)}
            inputValue={organizerSearchQuery}
            value={organizerPlayer}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Jugador Organizador *"
                placeholder="Buscar jugador (mínimo 2 caracteres)..."
                fullWidth
                helperText="Solo se muestran jugadores con token FCM activo"
              />
            )}
            noOptionsText={
              isLoadingPlayers
                ? 'Buscando...'
                : organizerSearchQuery.length < 2
                  ? 'Escribe al menos 2 caracteres...'
                  : 'No se encontraron jugadores'
            }
            filterOptions={(x) => x}
          />

          {/* Lado y Posición del Organizador */}
          {organizerPlayer && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Lado</InputLabel>
                <Select
                  value={playerSide}
                  onChange={(e) => setPlayerSide(e.target.value)}
                  label="Lado"
                >
                  <MenuItem value="drive">Drive</MenuItem>
                  <MenuItem value="reves">Revés</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Posición</InputLabel>
                <Select
                  value={playerPosition}
                  onChange={(e) => setPlayerPosition(e.target.value)}
                  label="Posición"
                >
                  <MenuItem value="izquierda">Izquierda</MenuItem>
                  <MenuItem value="derecha">Derecha</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Restricciones de Categoría */}
          <FormControlLabel
            control={
              <Switch
                checked={categoryRestricted}
                onChange={(e) => {
                  setCategoryRestricted(e.target.checked);
                  if (!e.target.checked) {
                    setCategoryRestrictionType('NONE');
                  }
                }}
              />
            }
            label="Activar restricciones de categoría"
          />

          {categoryRestricted && (
            <FormControl fullWidth>
              <InputLabel>Tipo de Restricción</InputLabel>
              <Select
                value={categoryRestrictionType}
                onChange={(e) => setCategoryRestrictionType(e.target.value)}
                label="Tipo de Restricción"
              >
                <MenuItem value="NONE">Sin restricción</MenuItem>
                <MenuItem value="SAME_CATEGORY">Misma categoría</MenuItem>
                <MenuItem value="NEARBY_CATEGORIES">Categorías cercanas</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Partido Mixto */}
          <FormControlLabel
            control={
              <Switch
                checked={isMixedMatch}
                onChange={(e) => {
                  setIsMixedMatch(e.target.checked);
                  if (e.target.checked) {
                    setCategoryRestricted(false);
                    setCategoryRestrictionType('NONE');
                    // Si el organizador es hombre, usar su categoría como free_category
                    if (organizerPlayer?.gender === 'Masculino') {
                      setFreeCategory(organizerPlayer.category || '9na');
                    }
                  } else {
                    setFreeCategory('');
                  }
                }}
              />
            }
            label="Partido Mixto"
          />

          {isMixedMatch && organizerPlayer && (
            <>
              {organizerPlayer.gender === 'Femenino' && (
                <FormControl fullWidth>
                  <InputLabel>Categoría Libre *</InputLabel>
                  <Select
                    value={freeCategory}
                    onChange={(e) => setFreeCategory(String(e.target.value))}
                    label="Categoría Libre *"
                    required
                  >
                    {categories.map((cat: string) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {organizerPlayer.gender === 'Masculino' && (
                <Alert severity="info">
                  La categoría libre se establecerá automáticamente como la categoría del organizador ({organizerPlayer.category || '9na'})
                </Alert>
              )}
            </>
          )}

          {/* Botones */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/turnos')}
              disabled={createTurnMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!isFormValid || !isMixedMatchValid || !isCategoryRestrictionValid || createTurnMutation.isPending}
              startIcon={createTurnMutation.isPending ? <CircularProgress size={20} /> : null}
            >
              {createTurnMutation.isPending ? 'Creando...' : 'Crear Turno'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
