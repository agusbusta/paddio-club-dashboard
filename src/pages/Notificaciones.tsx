import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notifications';
import { Notification } from '../types/notification';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TYPE_LABELS: { [key: string]: string } = {
  turn_cancelled: 'Turno Cancelado',
  turn_completed: 'Turno Completado',
  turn_joined: 'Jugador Agregado',
  external_request: 'Nuevo Turno',
  external_request_rejected: 'Solicitud Rechazada',
  broadcast_notification: 'Notificación Global',
  admin_notification: 'Notificación Administrativa',
};

const TYPE_COLORS: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
  turn_cancelled: 'error',
  turn_completed: 'success',
  turn_joined: 'info',
  external_request: 'warning',
  external_request_rejected: 'error',
  broadcast_notification: 'primary',
  admin_notification: 'secondary',
};

export const Notificaciones: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    refetchOnWindowFocus: true, // Solo refrescar cuando la ventana recupera el foco
    // Sin refetchInterval - las notificaciones llegan en tiempo real por push
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificación marcada como leída');
    },
    onError: () => {
      toast.error('Error al marcar la notificación como leída');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: () => {
      toast.error('Error al marcar las notificaciones como leídas');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId: number) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificación eliminada');
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    },
    onError: () => {
      toast.error('Error al eliminar la notificación');
    },
  });

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailDialogOpen(true);
    // Marcar como leída automáticamente al ver detalles
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleDelete = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (notificationToDelete) {
      deleteMutation.mutate(notificationToDelete.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner message="Cargando notificaciones..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        title="Error al cargar notificaciones"
        message="No se pudieron cargar las notificaciones. Por favor, intenta más tarde."
        onRetry={() => refetch()}
      />
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;
  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <Box>
      <Breadcrumbs items={[
        { label: 'Inicio', path: '/' },
        { label: 'Notificaciones' },
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
              letterSpacing: '-0.5px',
              fontSize: { xs: '1.75rem', sm: '2.5rem' },
            }}
          >
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: '#5D6D7E',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {unreadCount} no leída{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<MarkEmailReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            sx={{
              mt: { xs: 1, sm: 0 },
              fontWeight: 600,
              borderRadius: 2,
              borderColor: '#5D6D7E',
              color: '#0A2239',
              '&:hover': {
                borderColor: '#5BE12C',
                background: 'rgba(91, 225, 44, 0.05)',
              },
            }}
          >
            Marcar todas como leídas
          </Button>
        )}
      </Box>

      {notifications.length === 0 ? (
        <EmptyState
          title="No hay notificaciones"
          message="Las notificaciones importantes aparecerán aquí."
          icon={<NotificationsIcon sx={{ fontSize: 64 }} />}
        />
      ) : (
        <>
          {/* Notificaciones no leídas */}
          {unreadNotifications.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                fontWeight={900}
                gutterBottom
                sx={{
                  mb: 3,
                  color: '#0A2239',
                  letterSpacing: '-0.3px',
                  fontSize: '1.25rem',
                }}
              >
                No Leídas ({unreadNotifications.length})
              </Typography>
              <Paper
                sx={{
                  background: '#ffffff',
                  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
                elevation={0}
              >
                <List>
                  {unreadNotifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        disablePadding
                      >
                        <ListItemButton
                          onClick={() => handleViewDetails(notification)}
                          sx={{
                            py: 2,
                            px: 2,
                            bgcolor: 'rgba(91, 225, 44, 0.05)',
                            borderLeft: '3px solid #5BE12C',
                            '&:hover': {
                              bgcolor: 'rgba(91, 225, 44, 0.1)',
                              transform: 'translateX(4px)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                          <CircleIcon sx={{ fontSize: 12, color: '#5BE12C' }} />
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {notification.title}
                              </Typography>
                              <Chip
                                label={TYPE_LABELS[notification.type] || notification.type}
                                color={TYPE_COLORS[notification.type] || 'default'}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => handleDelete(notification, e)}
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
                        </ListItemSecondaryAction>
                        </ListItemButton>
                      </ListItem>
                      {index < unreadNotifications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          {/* Notificaciones leídas */}
          {readNotifications.length > 0 && (
            <Box>
              <Typography
                variant="h6"
                fontWeight={900}
                gutterBottom
                sx={{
                  mb: 3,
                  color: '#0A2239',
                  letterSpacing: '-0.3px',
                  fontSize: '1.25rem',
                }}
              >
                Leídas ({readNotifications.length})
              </Typography>
              <Paper
                sx={{
                  background: '#ffffff',
                  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
                elevation={0}
              >
                <List>
                  {readNotifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        disablePadding
                      >
                        <ListItemButton
                          onClick={() => handleViewDetails(notification)}
                          sx={{
                            py: 2,
                            px: 2,
                            opacity: 0.7,
                            '&:hover': {
                              opacity: 1,
                              bgcolor: 'rgba(0, 0, 0, 0.03)',
                              transform: 'translateX(4px)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: '#5D6D7E' }} />
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" fontWeight={500}>
                                {notification.title}
                              </Typography>
                              <Chip
                                label={TYPE_LABELS[notification.type] || notification.type}
                                color={TYPE_COLORS[notification.type] || 'default'}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => handleDelete(notification, e)}
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
                        </ListItemSecondaryAction>
                        </ListItemButton>
                      </ListItem>
                      {index < readNotifications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </>
      )}

      {/* Diálogo de detalles */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, rgba(91, 225, 44, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(91, 225, 44, 0.3)',
              }}
            >
              <NotificationsIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              fontWeight={900}
              sx={{
                color: '#0A2239',
                letterSpacing: '-0.3px',
                fontSize: '1.25rem',
              }}
            >
              {selectedNotification?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Chip
                  label={TYPE_LABELS[selectedNotification.type] || selectedNotification.type}
                  color={TYPE_COLORS[selectedNotification.type] || 'default'}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {selectedNotification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(selectedNotification.created_at), 'dd/MM/yyyy HH:mm')}
                </Typography>
              </Box>
              
              {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                    Detalles del turno:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      {selectedNotification.data.turn_id && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              ID del Turno
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              #{selectedNotification.data.turn_id}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {selectedNotification.data.start_time && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Horario
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedNotification.data.start_time}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {selectedNotification.data.date && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Fecha
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {format(new Date(selectedNotification.data.date), 'dd/MM/yyyy')}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {selectedNotification.data.court_name && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Cancha
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedNotification.data.court_name}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {selectedNotification.data.club_name && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Club
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedNotification.data.club_name}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {(selectedNotification.data.organizer_name || selectedNotification.data.requesting_player_name) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {selectedNotification.data.organizer_name ? 'Organizador' : 'Jugador'}
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedNotification.data.organizer_name || selectedNotification.data.requesting_player_name}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {selectedNotification.data.cancellation_message && (
                        <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                          <Typography variant="caption" color="text.secondary">
                            Motivo de cancelación
                          </Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                            {selectedNotification.data.cancellation_message}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setDetailDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              borderColor: '#5D6D7E',
              color: '#0A2239',
              '&:hover': {
                borderColor: '#5BE12C',
                background: 'rgba(91, 225, 44, 0.05)',
              },
            }}
          >
            Cerrar
          </Button>
          {selectedNotification?.data?.turn_id && (
            <Button
              variant="contained"
              startIcon={<VisibilityIcon />}
              onClick={() => {
                setDetailDialogOpen(false);
                navigate(`/turnos/${selectedNotification.data!.turn_id}`);
              }}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '0.95rem',
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
              Ver detalle del turno
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setNotificationToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar notificación"
        message="¿Estás seguro de que deseas eliminar esta notificación?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmColor="error"
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};
