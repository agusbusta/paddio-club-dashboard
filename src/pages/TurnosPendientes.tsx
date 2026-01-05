import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AccessTime,
  People,
  Warning,
  Visibility,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { pregameTurnService } from '../services/pregameTurns';
import { PregameTurn, PregameTurnStatus } from '../types/pregameTurn';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const TurnosPendientes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Obtener todos los turnos
  const { data: turnsData, isLoading } = useQuery({
    queryKey: ['pregameTurns', user?.club_id],
    queryFn: () => {
      if (!user?.club_id) throw new Error('No tienes un club asignado');
      return pregameTurnService.getPregameTurnsForClub(user.club_id);
    },
    enabled: !!user?.club_id,
  });

  // Filtrar turnos pendientes
  const pendingTurns = useMemo(() => {
    if (!turnsData?.pregame_turns) return [];
    return turnsData.pregame_turns.filter((turn: PregameTurn) => {
      if (turn.status !== PregameTurnStatus.PENDING) return false;
      
      // Filtrar por búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const courtName = turn.court_name?.toLowerCase() || '';
        const date = turn.date ? format(new Date(turn.date), 'dd/MM/yyyy', { locale: es }) : '';
        return courtName.includes(query) || date.includes(query);
      }
      
      return true;
    });
  }, [turnsData, searchQuery]);

  // Ordenar por fecha (más cercanos primero)
  const sortedTurns = useMemo(() => {
    return [...pendingTurns].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [pendingTurns]);

  // Función helper para contar jugadores
  const countPlayers = (turn: PregameTurn): number => {
    let count = 0;
    if (turn.player1_id) count++;
    if (turn.player2_id) count++;
    if (turn.player3_id) count++;
    if (turn.player4_id) count++;
    return count;
  };

  const getPlayersNeeded = (turn: PregameTurn): number => {
    const playersCount = countPlayers(turn);
    return Math.max(0, 4 - playersCount);
  };

  const isTurnNearDate = (turn: PregameTurn): boolean => {
    if (!turn.date) return false;
    const turnDate = new Date(turn.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    turnDate.setHours(0, 0, 0, 0);
    return turnDate >= today && turnDate <= tomorrow;
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
        { label: 'Pendientes' },
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
          Turnos Pendientes
        </Typography>
        <TextField
          placeholder="Buscar por cancha o fecha..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            minWidth: { xs: '100%', sm: 300 },
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
        />
      </Box>

      {sortedTurns.length === 0 ? (
        <Box
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
            icon={<Warning sx={{ fontSize: 28 }} />}
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
            No hay turnos pendientes en este momento.
          </Alert>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          {sortedTurns.map((turn) => {
            const playersNeeded = getPlayersNeeded(turn);
            const isNear = isTurnNearDate(turn);

            return (
              <Card
                key={turn.id}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  background: '#ffffff',
                  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: isNear ? '#FF9800' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                    borderColor: isNear ? '#F57C00' : '#5BE12C',
                  },
                }}
                elevation={0}
                onClick={() => navigate(`/turnos/${turn.id}`)}
              >
                {isNear && (
                  <Chip
                    icon={<Warning />}
                    label="Próximo"
                    color="warning"
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                  />
                )}
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        sx={{
                          color: '#0A2239',
                          mb: 0.5,
                          letterSpacing: '-0.3px',
                          fontSize: '1.25rem',
                        }}
                      >
                        {turn.court_name || 'Cancha'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#5D6D7E',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {turn.date && format(new Date(turn.date), 'dd/MM/yyyy', { locale: es })}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${countPlayers(turn)}/4`}
                      color={playersNeeded === 0 ? 'success' : 'warning'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        height: 28,
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<AccessTime />}
                      label={`${turn.start_time} - ${turn.end_time}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<People />}
                      label={`Faltan ${playersNeeded} jugador${playersNeeded !== 1 ? 'es' : ''}`}
                      size="small"
                      color="warning"
                    />
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<Visibility />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/turnos/${turn.id}`);
                    }}
                    fullWidth
                    sx={{
                      mt: 2,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      borderRadius: 2,
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
                    Ver Detalle
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
