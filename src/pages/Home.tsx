import React from 'react';
import { Box, Typography } from '@mui/material';
import TurnosDelDiaSection from '../sections/TurnosDelDiaSection';

export const Home: React.FC = () => {
  return (
    <Box>
      <Typography variant="h3" fontWeight={900} gutterBottom sx={{ color: 'primary.main', mb: 4 }}>
        Bienvenido a tu Dashboard
      </Typography>
      <TurnosDelDiaSection />
    </Box>
  );
}; 