import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Add as AddIcon, SportsTennis, Build, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, type: 'spring', stiffness: 60 }
  }),
};

export const Canchas: React.FC = () => {
  const cards = [
    {
      title: 'Lista de Canchas',
      icon: <SportsTennis sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
    {
      title: 'Estado de Canchas',
      icon: <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />,
    },
    {
      title: 'Mantenimiento',
      icon: <Build sx={{ fontSize: 40, color: 'secondary.main' }} />,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3" fontWeight={900} sx={{ color: 'primary.main' }}>
          Gestión de Canchas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ fontWeight: 700, fontSize: '1rem', borderRadius: 12 }}
          onClick={() => {/* Aquí irá la lógica para agregar cancha */}}
        >
          Nueva Cancha
        </Button>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(91,225,44,0.15)' }}
            style={{ borderRadius: 16 }}
          >
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                minHeight: 140,
                boxShadow: '0 4px 24px rgba(10,34,57,0.08)',
                border: '2px solid',
                borderColor: i === 0 ? 'primary.main' : i === 1 ? 'success.main' : 'secondary.main',
                transition: 'border-color 0.2s',
                cursor: 'pointer',
              }}
              elevation={0}
            >
              {card.icon}
              <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
                {card.title}
              </Typography>
              {/* Aquí irá el contenido dinámico */}
            </Paper>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
}; 