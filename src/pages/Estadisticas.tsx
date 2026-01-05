import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  SportsTennis as CourtIcon,
  CheckCircle as AvailableIcon,
  Schedule as TurnIcon,
  MonetizationOn as RevenueIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { statisticsService } from '../services/statistics';
import { PregameTurnStatus } from '../types/pregameTurn';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#5BE12C', '#0A2239', '#FFA500', '#FF6B6B', '#4ECDC4'];

const STATUS_LABELS: { [key in PregameTurnStatus]: string } = {
  AVAILABLE: 'Disponible',
  PENDING: 'Pendiente',
  READY_TO_PLAY: 'Listo',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}> = ({ title, value, icon, color = '#5BE12C', subtitle }) => {
  return (
    <Card
      sx={{
        height: '100%',
        background: '#ffffff',
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        borderRadius: 3,
        border: '2px solid',
        borderColor: 'transparent',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          borderColor: color,
        },
      }}
      elevation={0}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${color}40`,
            }}
          >
            <Box sx={{ color: '#fff', fontSize: 28 }}>{icon}</Box>
          </Box>
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              color: '#0A2239',
              letterSpacing: '-0.5px',
              fontSize: '2rem',
            }}
          >
            {value}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          fontWeight={900}
          sx={{
            color: '#0A2239',
            mb: 0.5,
            letterSpacing: '-0.3px',
            fontSize: '1.1rem',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: '#5D6D7E',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export const Estadisticas: React.FC = () => {
  const { user } = useAuth();

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
    return (
      <Box>
        <Breadcrumbs items={[
          { label: 'Inicio', path: '/' },
          { label: 'Estadísticas' },
        ]} />
        <Typography variant="h3" fontWeight={900} gutterBottom sx={{ color: 'primary.main', mb: 4, fontSize: { xs: '1.75rem', sm: '2.5rem' } }}>
          Estadísticas
        </Typography>
        <SkeletonLoader variant="stat" count={6} />
      </Box>
    );
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

  // Formatear ingresos de centavos a pesos (mostrar en miles si es >= 1000)
  const formatCurrency = (cents: number) => {
    const pesos = cents / 100;
    // Formatear con separadores de miles
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(pesos);
  };

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/' },
          { label: 'Estadísticas' },
        ]}
      />
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
        Estadísticas
      </Typography>

      {/* Estadísticas Generales */}
      <Box sx={{ mb: 5 }}>
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
          Estadísticas Generales
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          <StatCard
            title="Total Canchas"
            value={stats.totalCourts}
            icon={<CourtIcon />}
            color="#5BE12C"
            subtitle={`${stats.availableCourts} disponibles`}
          />
          <StatCard
            title="Canchas Disponibles"
            value={stats.availableCourts}
            icon={<AvailableIcon />}
            color="#5BE12C"
            subtitle={`${stats.maintenanceCourts} en mantenimiento`}
          />
          <StatCard
            title="Turnos Hoy"
            value={stats.todayTurns.total}
            icon={<TurnIcon />}
            color="#1B3358"
            subtitle={`${stats.todayTurns.readyToPlay} listos, ${stats.todayTurns.pending} pendientes`}
          />
          <StatCard
            title="Ingresos Hoy"
            value={formatCurrency(stats.todayRevenue)}
            icon={<RevenueIcon />}
            color="#5BE12C"
          />
        </Box>
      </Box>

      {/* Estadísticas Adicionales */}
      <Box sx={{ mb: 5 }}>
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
          Estadísticas Adicionales
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <StatCard
            title="Jugadores Únicos"
            value={stats.uniquePlayersThisMonth}
            icon={<PeopleIcon />}
            color="#0A2239"
            subtitle="Este mes"
          />
          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(stats.monthRevenue)}
            icon={<TrendingUpIcon />}
            color="#5BE12C"
            subtitle="Total acumulado"
          />
        </Box>
      </Box>

      {/* Gráficos */}
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
          Análisis y Gráficos
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          {/* Ocupación por Día de la Semana */}
          <Paper
            sx={{
              p: 3,
              background: '#ffffff',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
              borderRadius: 3,
            }}
            elevation={0}
          >
            <Typography
              variant="h6"
              fontWeight={900}
              gutterBottom
              sx={{
                mb: 2,
                color: '#0A2239',
                letterSpacing: '-0.3px',
                fontSize: '1.25rem',
              }}
            >
              Ocupación por Día de la Semana
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.occupancyByDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: '#5D6D7E', fontSize: 12 }}
                  stroke="#5D6D7E"
                />
                <YAxis 
                  tick={{ fill: '#5D6D7E', fontSize: 12 }}
                  stroke="#5D6D7E"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E9F2',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="occupancy" fill="#5BE12C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Ingresos por Día */}
          <Paper
            sx={{
              p: 3,
              background: '#ffffff',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
              borderRadius: 3,
            }}
            elevation={0}
          >
            <Typography
              variant="h6"
              fontWeight={900}
              gutterBottom
              sx={{
                mb: 2,
                color: '#0A2239',
                letterSpacing: '-0.3px',
                fontSize: '1.25rem',
              }}
            >
              Ingresos por Día (Últimos 30 días)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#5D6D7E', fontSize: 12 }}
                  stroke="#5D6D7E"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickFormatter={(value) => {
                    try {
                      return format(parseISO(value), 'dd/MM', { locale: es });
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis 
                  tick={{ fill: '#5D6D7E', fontSize: 12 }}
                  stroke="#5D6D7E"
                  tickFormatter={(value) => {
                    // value viene en centavos, convertir a pesos
                    const pesos = value / 100;
                    // Formatear en miles si es >= 1000
                    if (pesos >= 1000) {
                      const miles = pesos / 1000;
                      if (miles >= 1000) {
                        // Si son millones
                        return `$${(miles / 1000).toFixed(1)}M`;
                      }
                      // Mostrar en miles (ej: 30k para 30,000)
                      return `$${miles.toFixed(1)}k`;
                    }
                    // Mostrar en pesos normales
                    return `$${Math.round(pesos).toLocaleString('es-AR')}`;
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E9F2',
                    borderRadius: 8,
                  }}
                  formatter={(value: number | undefined) => value ? formatCurrency(value) : ''}
                  labelFormatter={(label) => {
                    try {
                      return format(parseISO(label), 'dd/MM/yyyy', { locale: es });
                    } catch {
                      return label;
                    }
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#5BE12C" 
                  strokeWidth={3}
                  dot={{ fill: '#5BE12C', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Turnos por Estado */}
          <Paper
            sx={{
              p: 3,
              background: '#ffffff',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
              borderRadius: 3,
            }}
            elevation={0}
          >
            <Typography
              variant="h6"
              fontWeight={900}
              gutterBottom
              sx={{
                mb: 2,
                color: '#0A2239',
                letterSpacing: '-0.3px',
                fontSize: '1.25rem',
              }}
            >
              Turnos por Estado
            </Typography>
            {stats.turnsByStatus && stats.turnsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.turnsByStatus.map((item, index) => ({
                      ...item,
                      name: STATUS_LABELS[item.status as PregameTurnStatus] || item.status,
                      color: COLORS[index % COLORS.length],
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => 
                      `${name}: ${value} (${percent ? (percent * 100).toFixed(0) : 0}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.turnsByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E9F2',
                      borderRadius: 8,
                    }}
                    formatter={(value: number | undefined) => value ? `${value} turnos` : '0 turnos'}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay datos de turnos por estado disponibles
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Cancha Más Utilizada */}
          {stats.mostUsedCourt && (
            <Paper
              sx={{
                p: 3,
                background: '#ffffff',
                boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                borderRadius: 3,
              }}
              elevation={0}
            >
              <Typography
                variant="h6"
                fontWeight={900}
                gutterBottom
                sx={{
                  mb: 2,
                  color: '#0A2239',
                  letterSpacing: '-0.3px',
                  fontSize: '1.25rem',
                }}
              >
                Cancha Más Utilizada
              </Typography>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  fontWeight={900}
                  sx={{
                    color: '#5BE12C',
                    mb: 1,
                    letterSpacing: '-0.5px',
                    fontSize: '2rem',
                  }}
                >
                  {stats.mostUsedCourt.courtName}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#5D6D7E',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  {stats.mostUsedCourt.turnCount} turnos
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};
