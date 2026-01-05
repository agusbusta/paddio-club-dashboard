import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { CalendarMonth, PendingActions, History, AddCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 100 },
  }),
};

export const Turnos: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Crear Turno',
      icon: <AddCircle />,
      path: '/turnos/crear',
      description: 'Crear un nuevo turno desde cero y asignar organizador',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
      borderColor: '#FF9800',
    },
    {
      title: 'Calendario de Turnos',
      icon: <CalendarMonth />,
      path: '/turnos/calendario',
      description: 'Vista mensual de todos los turnos del club',
      gradient: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
      borderColor: '#5BE12C',
    },
    {
      title: 'Turnos Pendientes',
      icon: <PendingActions />,
      path: '/turnos/pendientes',
      description: 'Turnos que necesitan más jugadores',
      gradient: 'linear-gradient(135deg, #1B3358 0%, #0A2239 100%)',
      borderColor: '#1B3358',
    },
    {
      title: 'Historial de Turnos',
      icon: <History />,
      path: '/turnos/historial',
      description: 'Turnos completados y cancelados',
      gradient: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
      borderColor: '#5BE12C',
    },
  ];

  return (
    <Box>
      <Breadcrumbs />
      <Typography
        variant="h3"
        fontWeight={900}
        gutterBottom
        sx={{
          color: '#0A2239',
          mb: 4,
          letterSpacing: '-0.5px',
          fontSize: { xs: '1.75rem', sm: '2.5rem' },
        }}
      >
        Gestión de Turnos
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
          >
            <Paper
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2.5,
                minHeight: 200,
                background: '#ffffff',
                boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                borderRadius: 3,
                border: '2px solid',
                borderColor: 'transparent',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                  borderColor: card.borderColor,
                },
              }}
              elevation={0}
              onClick={() => navigate(card.path)}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  mb: 1,
                }}
              >
                <Box sx={{ color: '#fff', fontSize: 32 }}>
                  {card.icon}
                </Box>
              </Box>
              <Typography
                variant="h5"
                fontWeight={900}
                sx={{
                  color: '#0A2239',
                  letterSpacing: '-0.3px',
                  fontSize: '1.5rem',
                }}
              >
                {card.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#5D6D7E',
                  flexGrow: 1,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  lineHeight: 1.6,
                }}
              >
                {card.description}
              </Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};
