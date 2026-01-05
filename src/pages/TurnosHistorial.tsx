import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
} from '@mui/material';
import {
  Download,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { pregameTurnService } from '../services/pregameTurns';
import { courtService } from '../services/courts';
import { PregameTurn, PregameTurnStatus } from '../types/pregameTurn';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const STATUS_COLORS: { [key in PregameTurnStatus]: string } = {
  AVAILABLE: '#5BE12C',
  PENDING: '#FFA500',
  READY_TO_PLAY: '#4ECDC4',
  CANCELLED: '#FF6B6B',
  COMPLETED: '#0A2239',
};

const STATUS_LABELS: { [key in PregameTurnStatus]: string } = {
  AVAILABLE: 'Disponible',
  PENDING: 'Pendiente',
  READY_TO_PLAY: 'Listo',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
};

export const TurnosHistorial: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<PregameTurnStatus | 'all'>('all');
  const [filterCourt, setFilterCourt] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTurn, setSelectedTurn] = useState<PregameTurn | null>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Obtener canchas
  const { data: courts = [] } = useQuery({
    queryKey: ['courts', user?.club_id],
    queryFn: () => courtService.getCourts(),
    enabled: !!user?.club_id,
    select: (data) => {
      if (!user?.club_id) return [];
      return data.filter((court: any) => court.club_id === user.club_id);
    },
  });

  // Obtener todos los turnos
  const { data: turnsData, isLoading } = useQuery({
    queryKey: ['pregameTurns', user?.club_id],
    queryFn: () => {
      if (!user?.club_id) throw new Error('No tienes un club asignado');
      return pregameTurnService.getPregameTurnsForClub(user.club_id);
    },
    enabled: !!user?.club_id,
  });

  // Filtrar turnos históricos (completados o cancelados)
  const historicalTurns = useMemo(() => {
    if (!turnsData?.pregame_turns) return [];
    return turnsData.pregame_turns.filter((turn: PregameTurn) => {
      return turn.status === PregameTurnStatus.COMPLETED || turn.status === PregameTurnStatus.CANCELLED;
    });
  }, [turnsData]);

  // Aplicar filtros
  const filteredTurns = useMemo(() => {
    return historicalTurns.filter((turn: PregameTurn) => {
      // Filtro por estado
      if (filterStatus !== 'all' && turn.status !== filterStatus) return false;

      // Filtro por cancha
      if (filterCourt !== 'all' && turn.court_id !== filterCourt) return false;

      // Filtro por fecha
      if (startDate && turn.date && turn.date < startDate) return false;
      if (endDate && turn.date && turn.date > endDate) return false;

      // Filtro por búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const courtName = turn.court_name?.toLowerCase() || '';
        const date = turn.date ? format(new Date(turn.date), 'dd/MM/yyyy', { locale: es }) : '';
        return courtName.includes(query) || date.includes(query);
      }

      return true;
    });
  }, [historicalTurns, filterStatus, filterCourt, startDate, endDate, searchQuery]);

  // Ordenar por fecha (más recientes primero)
  const sortedTurns = useMemo(() => {
    return [...filteredTurns].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filteredTurns]);

  const handleExportCSV = () => {
    const csvData = sortedTurns.map((turn) => ({
      Fecha: turn.date ? format(new Date(turn.date), 'dd/MM/yyyy', { locale: es }) : '',
      Horario: `${turn.start_time} - ${turn.end_time}`,
      Cancha: turn.court_name || 'N/A',
      Estado: STATUS_LABELS[turn.status],
      Jugadores: turn.players_count || 0,
      'Precio Total': turn.price ? `$${(turn.price / 100).toLocaleString('es-AR')}` : 'N/A',
      'Precio por Jugador': turn.price ? `$${((turn.price / 100) / 4).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A',
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_turnos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    setExportMenuAnchor(null);
    toast.success('Historial exportado a CSV exitosamente');
  };

  const handleExportExcel = () => {
    const excelData = sortedTurns.map((turn) => ({
      Fecha: turn.date ? format(new Date(turn.date), 'dd/MM/yyyy', { locale: es }) : '',
      Horario: `${turn.start_time} - ${turn.end_time}`,
      Cancha: turn.court_name || 'N/A',
      Estado: STATUS_LABELS[turn.status],
      Jugadores: turn.players_count || 0,
      'Precio Total': turn.price ? turn.price / 100 : 0,
      'Precio por Jugador': turn.price ? (turn.price / 100) / 4 : 0,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial de Turnos');
    XLSX.writeFile(wb, `historial_turnos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    setExportMenuAnchor(null);
    toast.success('Historial exportado a Excel exitosamente');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs items={[
        { label: 'Inicio', path: '/' },
        { label: 'Turnos', path: '/turnos' },
        { label: 'Historial' },
      ]} />
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h3" fontWeight={900} sx={{ color: 'primary.main', fontSize: { xs: '1.75rem', sm: '2.5rem' } }}>
          Historial de Turnos
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          >
            Exportar
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={handleExportCSV}>Exportar a CSV</MenuItem>
            <MenuItem onClick={handleExportExcel}>Exportar a Excel</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <TextField
            label="Buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            placeholder="Cancha o fecha..."
          />
          <FormControl size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              value={filterStatus}
              label="Estado"
              onChange={(e) => setFilterStatus(e.target.value as PregameTurnStatus | 'all')}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value={PregameTurnStatus.COMPLETED}>Completados</MenuItem>
              <MenuItem value={PregameTurnStatus.CANCELLED}>Cancelados</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Cancha</InputLabel>
            <Select
              value={filterCourt}
              label="Cancha"
              onChange={(e) => setFilterCourt(e.target.value as number | 'all')}
            >
              <MenuItem value="all">Todas</MenuItem>
              {courts.map((court: any) => (
                <MenuItem key={court.id} value={court.id}>
                  {court.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Desde"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Hasta"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Tabla */}
      {sortedTurns.length === 0 ? (
        <Alert severity="info">No hay turnos históricos que coincidan con los filtros.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Horario</TableCell>
                <TableCell>Cancha</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Jugadores</TableCell>
                <TableCell>Precio Total</TableCell>
                <TableCell>Precio por Jugador</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTurns.map((turn) => (
                <TableRow key={turn.id} hover>
                  <TableCell>
                    {turn.date && format(new Date(turn.date), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    {turn.start_time} - {turn.end_time}
                  </TableCell>
                  <TableCell>{turn.court_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[turn.status]}
                      size="small"
                      sx={{
                        backgroundColor: STATUS_COLORS[turn.status],
                        color: 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell>{turn.players_count || 0} / 4</TableCell>
                  <TableCell>
                    {turn.price ? `$${(turn.price / 100).toLocaleString('es-AR')}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {turn.price ? `$${((turn.price / 100) / 4).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => setSelectedTurn(turn)}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo de detalles */}
      <Dialog
        open={selectedTurn !== null}
        onClose={() => setSelectedTurn(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedTurn && (
          <>
            <DialogTitle>
              Detalles del Turno
              <IconButton
                aria-label="close"
                onClick={() => setSelectedTurn(null)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha
                  </Typography>
                  <Typography variant="body1">
                    {selectedTurn.date && format(new Date(selectedTurn.date), 'dd/MM/yyyy', { locale: es })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Horario
                  </Typography>
                  <Typography variant="body1">
                    {selectedTurn.start_time} - {selectedTurn.end_time}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cancha
                  </Typography>
                  <Typography variant="body1">{selectedTurn.court_name || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={STATUS_LABELS[selectedTurn.status]}
                    sx={{
                      backgroundColor: STATUS_COLORS[selectedTurn.status],
                      color: 'white',
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Jugadores
                  </Typography>
                  <Typography variant="body1">
                    {selectedTurn.players_count || 0} / 4
                  </Typography>
                </Box>
                {selectedTurn.price && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Precio Total
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        ${(selectedTurn.price / 100).toLocaleString('es-AR')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Precio por Jugador
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: 'primary.main' }}>
                        ${((selectedTurn.price / 100) / 4).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                  </>
                )}
                {selectedTurn.cancellation_message && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mensaje de Cancelación
                    </Typography>
                    <Typography variant="body1">
                      {selectedTurn.cancellation_message}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTurn(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
