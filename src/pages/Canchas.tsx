import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SportsTennis as CourtIcon,
  Lightbulb as LightbulbIcon,
  Home as HomeIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { courtService } from '../services/courts';
import { Court, CourtCreate, CourtUpdate, SURFACE_TYPES } from '../types/court';
import toast from 'react-hot-toast';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

const CourtCard: React.FC<{
  court: Court;
  onEdit: () => void;
  onDelete: () => void;
  onToggleMaintenance: () => void;
}> = ({ court, onEdit, onDelete, onToggleMaintenance }) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        borderRadius: 3,
        border: '2px solid',
        borderColor: court.is_available ? 'transparent' : '#FF9800',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          borderColor: court.is_available ? '#5BE12C' : '#F57C00',
        },
      }}
      elevation={0}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              fontWeight={900}
              sx={{
                color: '#0A2239',
                mb: 1,
                letterSpacing: '-0.3px',
                fontSize: '1.25rem',
              }}
            >
              {court.name}
            </Typography>
            {court.description && (
              <Typography
                variant="body2"
                sx={{
                  color: '#5D6D7E',
                  mb: 2,
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}
              >
                {court.description}
              </Typography>
            )}
          </Box>
          <Chip
            label={court.is_available ? 'Disponible' : 'En Mantenimiento'}
            color={court.is_available ? 'success' : 'warning'}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              height: 28,
            }}
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

        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Tooltip title="Editar cancha">
            <IconButton
              size="small"
              onClick={onEdit}
              sx={{
                color: '#5BE12C',
                '&:hover': {
                  background: 'rgba(91, 225, 44, 0.1)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={court.is_available ? 'Marcar en mantenimiento' : 'Marcar disponible'}>
            <IconButton
              size="small"
              onClick={onToggleMaintenance}
              sx={{
                color: court.is_available ? '#FF9800' : '#5BE12C',
                '&:hover': {
                  background: court.is_available
                    ? 'rgba(255, 152, 0, 0.1)'
                    : 'rgba(91, 225, 44, 0.1)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {court.is_available ? (
                <BuildIcon fontSize="small" />
              ) : (
                <CheckCircleIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar cancha">
            <IconButton
              size="small"
              onClick={onDelete}
              sx={{
                color: '#F44336',
                '&:hover': {
                  background: 'rgba(244, 67, 54, 0.1)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

const CourtFormDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  court?: Court | null;
  clubId: number;
  onSuccess: () => void;
}> = ({ open, onClose, court, clubId, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<CourtCreate>>({
    name: '',
    description: '',
    club_id: clubId,
    surface_type: 'artificial_grass',
    is_indoor: false,
    has_lighting: false,
    is_available: true,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CourtCreate) => courtService.createCourt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts'] });
      toast.success('Cancha creada exitosamente');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la cancha');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CourtUpdate) => courtService.updateCourt(court!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts'] });
      toast.success('Cancha actualizada exitosamente');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la cancha');
    },
  });

  React.useEffect(() => {
    if (court) {
      setFormData({
        name: court.name,
        description: court.description || '',
        club_id: court.club_id,
        surface_type: court.surface_type || 'artificial_grass',
        is_indoor: court.is_indoor,
        has_lighting: court.has_lighting,
        is_available: court.is_available,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        club_id: clubId,
        surface_type: 'artificial_grass',
        is_indoor: false,
        has_lighting: false,
        is_available: true,
      });
    }
  }, [court, clubId, open]);

  const handleSubmit = () => {
    if (!formData.name || !formData.surface_type) {
      toast.error('Nombre y tipo de superficie son requeridos');
      return;
    }

    if (court) {
      const updateData: CourtUpdate = {
        name: formData.name,
        description: formData.description,
        surface_type: formData.surface_type,
        is_indoor: formData.is_indoor,
        has_lighting: formData.has_lighting,
        is_available: formData.is_available,
      };
      updateMutation.mutate(updateData);
    } else {
      const createData: CourtCreate = {
        name: formData.name!,
        description: formData.description,
        club_id: clubId,
        surface_type: formData.surface_type!,
        is_indoor: formData.is_indoor || false,
        has_lighting: formData.has_lighting || false,
        is_available: formData.is_available !== false,
      };
      createMutation.mutate(createData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{court ? 'Editar Cancha' : 'Nueva Cancha'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
          <FormControl fullWidth>
            <InputLabel>Tipo de Superficie *</InputLabel>
            <Select
              value={formData.surface_type}
              label="Tipo de Superficie *"
              onChange={(e) => setFormData({ ...formData, surface_type: e.target.value })}
            >
              {SURFACE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_indoor || false}
                onChange={(e) => setFormData({ ...formData, is_indoor: e.target.checked })}
              />
            }
            label="Cancha Interior"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.has_lighting || false}
                onChange={(e) => setFormData({ ...formData, has_lighting: e.target.checked })}
              />
            }
            label="Tiene Iluminación"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_available !== false}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              />
            }
            label="Disponible"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const Canchas: React.FC = () => {
  const { user } = useAuth();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courtToDelete, setCourtToDelete] = useState<Court | null>(null);

  const queryClient = useQueryClient();

  const { data: courts = [], isLoading, error } = useQuery({
    queryKey: ['courts', user?.club_id],
    queryFn: () => courtService.getCourts(),
    enabled: !!user?.club_id,
    refetchOnWindowFocus: false,
    select: (data) => {
      // Filtrar canchas por club_id del usuario autenticado
      if (!user?.club_id) return [];
      return (data as Court[]).filter((court) => court.club_id === user.club_id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => courtService.deleteCourt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts'] });
      toast.success('Cancha eliminada exitosamente');
      setDeleteConfirmOpen(false);
      setCourtToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar la cancha');
    },
  });

  const toggleMaintenanceMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) =>
      courtService.updateCourt(id, { is_available: isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts'] });
      toast.success('Estado de cancha actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar el estado');
    },
  });

  const handleOpenFormDialog = () => {
    setEditingCourt(null);
    setIsFormDialogOpen(true);
  };

  const handleEditCourt = (court: Court) => {
    setEditingCourt(court);
    setIsFormDialogOpen(true);
  };

  const handleDeleteClick = (court: Court) => {
    setCourtToDelete(court);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (courtToDelete) {
      deleteMutation.mutate(courtToDelete.id);
    }
  };

  const handleToggleMaintenance = (court: Court) => {
    toggleMaintenanceMutation.mutate({
      id: court.id,
      isAvailable: !court.is_available,
    });
  };

  const availableCourts = (courts as Court[]).filter((c) => c.is_available).length;
  const maintenanceCourts = (courts as Court[]).filter((c) => !c.is_available).length;

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
        Error al cargar las canchas. Por favor, intenta más tarde.
      </Alert>
    );
  }

  return (
    <Box>
      <Breadcrumbs items={[
        { label: 'Inicio', path: '/' },
        { label: 'Canchas' },
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
        <Box>
          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              color: '#0A2239',
              mb: 1,
              letterSpacing: '-0.5px',
              fontSize: { xs: '1.75rem', sm: '2.5rem' },
            }}
          >
            Gestión de Canchas
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#5D6D7E',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {(courts as Court[]).length} cancha{(courts as Court[]).length !== 1 ? 's' : ''} •{' '}
            {availableCourts} disponible{availableCourts !== 1 ? 's' : ''} • {maintenanceCourts} en
            mantenimiento
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenFormDialog}
          sx={{
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: 2,
            mt: { xs: 1, sm: 0 },
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
          Nueva Cancha
        </Button>
      </Box>

      {(courts as Court[]).length === 0 ? (
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
            icon={<CourtIcon sx={{ fontSize: 28 }} />}
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
            No tienes canchas registradas. Crea tu primera cancha para comenzar.
          </Alert>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {(courts as Court[]).map((court: Court) => (
            <CourtCard
              key={court.id}
              court={court}
              onEdit={() => handleEditCourt(court)}
              onDelete={() => handleDeleteClick(court)}
              onToggleMaintenance={() => handleToggleMaintenance(court)}
            />
          ))}
        </Box>
      )}

      <CourtFormDialog
        open={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        court={editingCourt}
        clubId={user.club_id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['courts'] });
        }}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            ¿Estás seguro de que quieres eliminar la cancha "{courtToDelete?.name}"? Esta acción no
            se puede deshacer y también se eliminarán todos los turnos asociados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
