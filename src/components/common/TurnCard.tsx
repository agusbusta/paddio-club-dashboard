import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  Avatar,
} from '@mui/material';
import {
  AccessTime,
  CheckCircle,
  HourglassEmpty,
  Group,
} from '@mui/icons-material';

interface TurnCardPlayer {
  id: number;
  nombre: string;
  avatar: string;
  ladoCancha: 'izquierda' | 'derecha';
}

interface TurnCardProps {
  id: number;
  hora: string;
  estado: 'completo' | 'incompleto' | 'libre';
  courtName?: string;
  jugadores: TurnCardPlayer[];
  onViewDetails: () => void;
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

export const TurnCard: React.FC<TurnCardProps> = ({
  hora,
  estado,
  courtName,
  jugadores,
  onViewDetails,
}) => {
  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minHeight: 140,
        boxShadow: '0 4px 16px rgba(10,34,57,0.08)',
        border: '2px solid',
        borderColor: '#0A2239',
        borderRadius: 2,
        background: '#fff',
        cursor: 'pointer',
        transition: 'box-shadow 0.18s, border-color 0.18s',
        overflow: 'visible',
        '&:hover': {
          boxShadow: '0 8px 32px 0 rgba(10,34,57,0.13)',
          borderColor: '#0A2239',
          background: '#fff',
        },
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTime sx={{ color: '#0A2239', fontSize: 28 }} />
        <Typography variant="h6" fontWeight={700} sx={{ color: '#0A2239' }}>
          {hora} hs
        </Typography>
        <Chip
          label={estadoLabel[estado]}
          color={estadoColor[estado] as any}
          size="small"
          icon={
            estado === 'completo' ? <CheckCircle sx={{ color: '#5BE12C' }} /> :
            estado === 'incompleto' ? <HourglassEmpty sx={{ color: '#FFC107' }} /> : 
            <Group sx={{ color: '#0A2239' }} />
          }
          sx={{ 
            ml: 1, 
            fontWeight: 700, 
            bgcolor: estado === 'libre' ? '#0A2239' : undefined, 
            color: estado === 'libre' ? 'white' : undefined, 
            px: 1.5, 
            borderRadius: 2 
          }}
        />
      </Box>
      {courtName && (
        <Typography variant="body2" color="text.secondary">
          {courtName}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        {jugadores.length > 0 ? (
          jugadores.map((j) => (
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
          onClick={onViewDetails}
        >
          Ver Detalle
        </Button>
      </Box>
    </Paper>
  );
};
