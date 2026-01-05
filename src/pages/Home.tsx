import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CalendarMonth as CalendarIcon,
  PendingActions as PendingIcon,
  History as HistoryIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { statisticsService } from '../services/statistics';
import TurnosDelDiaSection from '../sections/TurnosDelDiaSection';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['clubStatistics', user?.club_id],
    queryFn: () => {
      if (!user?.club_id) throw new Error('No tienes un club asignado');
      return statisticsService.getClubStatistics(user.club_id);
    },
    enabled: !!user?.club_id,
    refetchInterval: 60000, // Refrescar cada minuto
  });

  if (isLoading) {
    return <LoadingSpinner message="Cargando estadísticas..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        title="Error al cargar estadísticas"
        message="No se pudieron cargar las estadísticas. Por favor, intenta más tarde."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!stats) {
    return null;
  }

  const shortcuts = [
    {
      title: 'Calendario de Turnos',
      icon: <CalendarIcon />,
      path: '/turnos/calendario',
      color: 'primary.main',
    },
    {
      title: 'Turnos Pendientes',
      icon: <PendingIcon />,
      path: '/turnos/pendientes',
      color: 'warning.main',
    },
    {
      title: 'Historial de Turnos',
      icon: <HistoryIcon />,
      path: '/turnos/historial',
      color: 'info.main',
    },
    {
      title: 'Estadísticas',
      icon: <BarChartIcon />,
      path: '/estadisticas',
      color: 'success.main',
    },
    {
      title: 'Agregar Cancha',
      icon: <AddIcon />,
      path: '/canchas',
      color: 'secondary.main',
    },
    {
      title: 'Configuración',
      icon: <SettingsIcon />,
      path: '/configuracion',
      color: 'text.secondary',
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: 'spring', stiffness: 100 },
    }),
  };

  return (
    <Box>
      {/* Alertas */}
      {stats.alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {stats.alerts.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Alert
                severity={alert.severity}
                icon={<WarningIcon />}
                sx={{
                  mb: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  '& .MuiAlert-icon': {
                    fontSize: 24,
                  },
                }}
              >
                {alert.message}
              </Alert>
            </motion.div>
          ))}
        </Box>
      )}

      {/* Turnos del Día */}
      <Box sx={{ mb: 5 }}>
        <TurnosDelDiaSection />
      </Box>

      {/* Atajos Rápidos */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          fontWeight={900}
          gutterBottom
          sx={{
            mb: 3,
            color: '#0A2239',
            letterSpacing: '-0.3px',
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
          }}
        >
          Atajos Rápidos
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(6, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {shortcuts.map((shortcut, index) => (
            <motion.div
              key={shortcut.path}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ scale: 1.05 }}
            >
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  minHeight: 140,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  border: '2px solid',
                  borderColor: 'transparent',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: shortcut.color === 'primary.main' ? '#5BE12C' : 
                                 shortcut.color === 'warning.main' ? '#FF9800' :
                                 shortcut.color === 'info.main' ? '#1B3358' :
                                 shortcut.color === 'success.main' ? '#5BE12C' :
                                 shortcut.color === 'secondary.main' ? '#0A2239' : '#5D6D7E',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  },
                }}
                onClick={() => navigate(shortcut.path)}
                elevation={0}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background:
                      shortcut.color === 'primary.main'
                        ? 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)'
                        : shortcut.color === 'warning.main'
                        ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                        : shortcut.color === 'info.main'
                        ? 'linear-gradient(135deg, #1B3358 0%, #0A2239 100%)'
                        : shortcut.color === 'success.main'
                        ? 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)'
                        : shortcut.color === 'secondary.main'
                        ? 'linear-gradient(135deg, #0A2239 0%, #000A16 100%)'
                        : 'linear-gradient(135deg, #5D6D7E 0%, #3D4A5C 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ color: '#fff', fontSize: 28 }}>
                    {shortcut.icon}
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  textAlign="center"
                  sx={{
                    color: '#0A2239',
                    fontSize: '0.875rem',
                  }}
                >
                  {shortcut.title}
                </Typography>
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
