import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  SportsTennis as CourtIcon,
  Lightbulb as LightbulbIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Court, SURFACE_TYPES } from '../../types/court';

interface CourtCardProps {
  court: Court;
  onEdit: () => void;
  onDelete: () => void;
  onToggleMaintenance: () => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({
  court,
  onEdit,
  onDelete,
  onToggleMaintenance,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {court.name}
            </Typography>
            {court.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {court.description}
              </Typography>
            )}
          </Box>
          <Chip
            label={court.is_available ? 'Disponible' : 'En Mantenimiento'}
            color={court.is_available ? 'success' : 'warning'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            icon={<CourtIcon />}
            label={
              SURFACE_TYPES.find((s) => s.value === court.surface_type)?.label ||
              court.surface_type ||
              'Sin especificar'
            }
            size="small"
            variant="outlined"
          />
          <Chip
            icon={court.is_indoor ? <HomeIcon /> : <CourtIcon />}
            label={court.is_indoor ? 'Interior' : 'Exterior'}
            size="small"
            variant="outlined"
          />
          {court.has_lighting && (
            <Chip
              icon={<LightbulbIcon />}
              label="Con Luz"
              size="small"
              variant="outlined"
              color="warning"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
          <Tooltip title="Editar cancha">
            <IconButton size="small" onClick={onEdit} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={court.is_available ? 'Marcar en mantenimiento' : 'Marcar disponible'}>
            <IconButton
              size="small"
              onClick={onToggleMaintenance}
              color={court.is_available ? 'warning' : 'success'}
            >
              {court.is_available ? <BuildIcon /> : <CheckCircleIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar cancha">
            <IconButton size="small" onClick={onDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};
