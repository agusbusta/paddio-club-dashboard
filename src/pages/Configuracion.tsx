import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Info, AccessTime, MonetizationOn, CalendarToday } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { clubService } from '../services/clubs';
import { ClubUpdate } from '../types/club';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`config-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Schema de validación para Información del Club
const infoSchema = yup.object({
  name: yup.string().required('El nombre es requerido'),
  address: yup.string().required('La dirección es requerida'),
  phone: yup.string(),
  email: yup.string().email('Email inválido'),
});

// Schema de validación para Horarios
const scheduleSchema = yup.object({
  opening_time: yup.string().required('La hora de apertura es requerida'),
  closing_time: yup.string().required('La hora de cierre es requerida'),
  turn_duration_minutes: yup
    .number()
    .required('La duración del turno es requerida')
    .min(30, 'La duración mínima es 30 minutos')
    .max(240, 'La duración máxima es 240 minutos'),
}).test('closing-after-opening', 'La hora de cierre debe ser posterior a la de apertura', function (values) {
  if (!values.opening_time || !values.closing_time) return true;
  const opening = values.opening_time.split(':').map(Number);
  const closing = values.closing_time.split(':').map(Number);
  const openingMinutes = opening[0] * 60 + opening[1];
  const closingMinutes = closing[0] * 60 + closing[1];
  return closingMinutes > openingMinutes;
});

// Schema de validación para Precios
const priceSchema = yup.object({
  price_per_turn: yup
    .number()
    .required('El precio es requerido')
    .min(0, 'El precio debe ser mayor o igual a 0'),
});

export const Configuracion: React.FC = () => {
  const [value, setValue] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener información del club
  const { data: club, isLoading, error } = useQuery({
    queryKey: ['club', user?.club_id],
    queryFn: () => {
      if (!user?.club_id) throw new Error('No tienes un club asignado');
      return clubService.getMyClub(user.club_id);
    },
    enabled: !!user?.club_id,
  });

  // Mutación para actualizar el club
  const updateMutation = useMutation({
    mutationFn: (data: ClubUpdate) => {
      if (!club) throw new Error('Club no encontrado');
      return clubService.updateClub(club.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club'] });
      toast.success('Configuración actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la configuración');
    },
  });

  // Mutación para regenerar turnos
  const regenerateTurnsMutation = useMutation({
    mutationFn: (daysAhead: number) => {
      if (!club) throw new Error('Club no encontrado');
      return clubService.generateTurns(club.id, daysAhead);
    },
    onSuccess: () => {
      toast.success('Turnos regenerados exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al regenerar turnos');
    },
  });

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Formulario de Información
  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    formState: { errors: errorsInfo },
    reset: resetInfo,
  } = useForm({
    resolver: yupResolver(infoSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
  });

  // Formulario de Horarios
  const {
    control: controlSchedule,
    handleSubmit: handleSubmitSchedule,
    formState: { errors: errorsSchedule },
    reset: resetSchedule,
  } = useForm({
    resolver: yupResolver(scheduleSchema),
    defaultValues: {
      opening_time: '08:00',
      closing_time: '22:00',
      turn_duration_minutes: 90,
    },
  });

  // Formulario de Precios
  const {
    register: registerPrice,
    handleSubmit: handleSubmitPrice,
    formState: { errors: errorsPrice },
    reset: resetPrice,
  } = useForm({
    resolver: yupResolver(priceSchema),
    defaultValues: {
      price_per_turn: 0,
    },
  });

  // Estado para días abiertos
  const [daysOpen, setDaysOpen] = useState({
    monday_open: true,
    tuesday_open: true,
    wednesday_open: true,
    thursday_open: true,
    friday_open: true,
    saturday_open: true,
    sunday_open: true,
  });

  // Cargar datos del club cuando esté disponible
  useEffect(() => {
    if (club) {
      resetInfo({
        name: club.name || '',
        address: club.address || '',
        phone: club.phone || '',
        email: club.email || '',
      });

      // Convertir opening_time y closing_time de "HH:MM:SS" a "HH:MM"
      const formatTime = (timeStr?: string) => {
        if (!timeStr) return '08:00';
        return timeStr.substring(0, 5);
      };

      resetSchedule({
        opening_time: formatTime(club.opening_time),
        closing_time: formatTime(club.closing_time),
        turn_duration_minutes: club.turn_duration_minutes || 90,
      });

      // Convertir precio de centavos a pesos
      resetPrice({
        price_per_turn: club.price_per_turn ? club.price_per_turn / 100 : 0,
      });

      setDaysOpen({
        monday_open: club.monday_open ?? true,
        tuesday_open: club.tuesday_open ?? true,
        wednesday_open: club.wednesday_open ?? true,
        thursday_open: club.thursday_open ?? true,
        friday_open: club.friday_open ?? true,
        saturday_open: club.saturday_open ?? true,
        sunday_open: club.sunday_open ?? true,
      });
    }
  }, [club, resetInfo, resetSchedule, resetPrice]);

  // Handlers de submit
  const onSubmitInfo = (data: any) => {
    updateMutation.mutate(data);
  };

  const onSubmitSchedule = (data: any) => {
    // Convertir "HH:MM" a "HH:MM:SS"
    const formatTimeForBackend = (time: string) => {
      return time.length === 5 ? `${time}:00` : time;
    };

    updateMutation.mutate({
      opening_time: formatTimeForBackend(data.opening_time),
      closing_time: formatTimeForBackend(data.closing_time),
      turn_duration_minutes: data.turn_duration_minutes,
    });
  };

  const onSubmitPrice = (data: any) => {
    // Convertir pesos a centavos
    updateMutation.mutate({
      price_per_turn: Math.round(data.price_per_turn * 100),
    });
  };

  const handleDaysOpenChange = (day: string, value: boolean) => {
    setDaysOpen((prev) => ({ ...prev, [day]: value }));
  };

  const handleSaveDaysOpen = () => {
    updateMutation.mutate(daysOpen);
  };

  const handleRegenerateTurns = () => {
    if (window.confirm('¿Estás seguro de regenerar los turnos? Esto eliminará los turnos existentes y creará nuevos según los horarios actuales.')) {
      regenerateTurnsMutation.mutate(30);
    }
  };

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
        Error al cargar la información del club. Por favor, intenta más tarde.
      </Alert>
    );
  }

  if (!club) {
    return (
      <Alert severity="warning">
        No tienes un club asignado. Contacta al administrador.
      </Alert>
    );
  }

  return (
    <Box>
      <Breadcrumbs items={[
        { label: 'Inicio', path: '/' },
        { label: 'Configuración' },
      ]} />
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
        Configuración
      </Typography>
      <Paper
        sx={{
          width: '100%',
          background: '#ffffff',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
        elevation={0}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              minHeight: 64,
              '&.Mui-selected': {
                color: '#5BE12C',
                fontWeight: 700,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#5BE12C',
              height: 3,
            },
          }}
        >
          <Tab label="Información del Club" icon={<Info />} iconPosition="start" />
          <Tab label="Horarios" icon={<AccessTime />} iconPosition="start" />
          <Tab label="Precios" icon={<MonetizationOn />} iconPosition="start" />
          <Tab label="Días Abiertos" icon={<CalendarToday />} iconPosition="start" />
        </Tabs>

        {/* Tab 1: Información del Club */}
        <TabPanel value={value} index={0}>
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
            Información del Club
          </Typography>
          <form onSubmit={handleSubmitInfo(onSubmitInfo)}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3,
              }}
            >
              <TextField
                label="Nombre del Club *"
                fullWidth
                {...registerInfo('name')}
                error={!!errorsInfo.name}
                helperText={errorsInfo.name?.message}
                sx={{
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
              <TextField
                label="Dirección *"
                fullWidth
                {...registerInfo('address')}
                error={!!errorsInfo.address}
                helperText={errorsInfo.address?.message}
                sx={{
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
              <TextField
                label="Teléfono"
                fullWidth
                {...registerInfo('phone')}
                error={!!errorsInfo.phone}
                helperText={errorsInfo.phone?.message}
                sx={{
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
              <TextField
                label="Email"
                fullWidth
                type="email"
                {...registerInfo('email')}
                error={!!errorsInfo.email}
                helperText={errorsInfo.email?.message}
                sx={{
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
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateMutation.isPending}
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
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </Box>
          </form>
        </TabPanel>

        {/* Tab 2: Horarios */}
        <TabPanel value={value} index={1}>
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
            Configuración de Horarios
          </Typography>
          <form onSubmit={handleSubmitSchedule(onSubmitSchedule)}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Controller
                name="opening_time"
                control={controlSchedule}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hora de Apertura *"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errorsSchedule.opening_time}
                    helperText={errorsSchedule.opening_time?.message}
                  />
                )}
              />
              <Controller
                name="closing_time"
                control={controlSchedule}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hora de Cierre *"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errorsSchedule.closing_time}
                    helperText={errorsSchedule.closing_time?.message}
                  />
                )}
              />
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Controller
                  name="turn_duration_minutes"
                  control={controlSchedule}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Duración del Turno (minutos) *"
                      type="number"
                      fullWidth
                      inputProps={{ min: 30, max: 240, step: 15 }}
                      error={!!errorsSchedule.turn_duration_minutes}
                      helperText={errorsSchedule.turn_duration_minutes?.message || 'Duración en minutos (30-240)'}
                    />
                  )}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateMutation.isPending}
                  sx={{
                    mt: 2,
                    mr: 2,
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
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar Horarios'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRegenerateTurns}
                  disabled={regenerateTurnsMutation.isPending}
                  sx={{
                    mt: 2,
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
                  {regenerateTurnsMutation.isPending ? 'Regenerando...' : 'Regenerar Turnos'}
                </Button>
              </Box>
            </Box>
          </form>
        </TabPanel>

        {/* Tab 3: Precios */}
        <TabPanel value={value} index={2}>
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
            Configuración de Precios
          </Typography>
          <form onSubmit={handleSubmitPrice(onSubmitPrice)}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <TextField
                label="Precio por Turno (en pesos) *"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 100 }}
                {...registerPrice('price_per_turn', { valueAsNumber: true })}
                error={!!errorsPrice.price_per_turn}
                helperText={errorsPrice.price_per_turn?.message || 'Ingresa el precio en pesos argentinos'}
              />
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateMutation.isPending}
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
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar Precio'}
                </Button>
              </Box>
            </Box>
          </form>
        </TabPanel>

        {/* Tab 4: Días Abiertos */}
        <TabPanel value={value} index={3}>
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
            Días de la Semana Abiertos
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {[
                { key: 'monday_open', label: 'Lunes' },
                { key: 'tuesday_open', label: 'Martes' },
                { key: 'wednesday_open', label: 'Miércoles' },
                { key: 'thursday_open', label: 'Jueves' },
                { key: 'friday_open', label: 'Viernes' },
                { key: 'saturday_open', label: 'Sábado' },
                { key: 'sunday_open', label: 'Domingo' },
              ].map((day) => (
                <FormControlLabel
                  key={day.key}
                  control={
                    <Checkbox
                      checked={daysOpen[day.key as keyof typeof daysOpen]}
                      onChange={(e) => handleDaysOpenChange(day.key, e.target.checked)}
                    />
                  }
                  label={day.label}
                />
              ))}
            </Box>
            <Button
              variant="contained"
              onClick={handleSaveDaysOpen}
              disabled={updateMutation.isPending}
              sx={{
                mt: 3,
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
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Días Abiertos'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};
