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
  IconButton,
  TextField,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  TablePagination,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Place as PlaceIcon,
  FileDownload as FileDownloadIcon,
  SportsTennis as SportsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { matchService } from '../services/matches';
import { Match } from '../types/match';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { exportToCSV, exportToExcel } from '../utils/export';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
  available: 'default',
  reserved: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const STATUS_LABELS: { [key: string]: string } = {
  available: 'Disponible',
  reserved: 'Reservado',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const Partidos: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCourt, setFilterCourt] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const { data: matches = [], isLoading, error, refetch } = useQuery({
    queryKey: ['matches', user?.club_id, filterStatus, filterStartDate, filterEndDate],
    queryFn: () =>
      matchService.getMatches({
        limit: 1000,
        status: filterStatus || undefined,
        club_id: user?.club_id,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
      }),
    enabled: !!user?.club_id,
  });

  // Filtrar matches por término de búsqueda y cancha
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Filtrar por término de búsqueda (nombre de jugador o cancha)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((match) => {
        const playerNames = match.players.map((p) => p.name.toLowerCase()).join(' ');
        const courtName = match.court_name?.toLowerCase() || '';
        return playerNames.includes(searchLower) || courtName.includes(searchLower);
      });
    }

    // Filtrar por cancha
    if (filterCourt) {
      filtered = filtered.filter((match) => match.court_id === Number(filterCourt));
    }

    return filtered;
  }, [matches, searchTerm, filterCourt]);

  // Obtener lista única de canchas para el filtro
  const courts = useMemo(() => {
    const courtMap = new Map<number, string>();
    matches.forEach((match) => {
      if (match.court_id && match.court_name) {
        courtMap.set(match.court_id, match.court_name);
      }
    });
    return Array.from(courtMap.entries()).map(([id, name]) => ({ id, name }));
  }, [matches]);

  // Paginación
  const paginatedMatches = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredMatches.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMatches, page, rowsPerPage]);

  const handleViewDetails = (match: Match) => {
    setSelectedMatch(match);
    setDetailDialogOpen(true);
  };

  const handleExportCSV = () => {
    try {
      const exportData = filteredMatches.map((match) => ({
        ID: match.id,
        Cancha: match.court_name || 'N/A',
        'Fecha Inicio': match.start_time ? format(new Date(match.start_time), 'dd/MM/yyyy HH:mm') : 'N/A',
        'Fecha Fin': match.end_time ? format(new Date(match.end_time), 'dd/MM/yyyy HH:mm') : 'N/A',
        Estado: STATUS_LABELS[match.status] || match.status,
        Marcador: match.score || 'N/A',
        Jugadores: match.players.map((p) => p.name).join(', '),
        'Creador': match.creator_name || 'N/A',
      }));
      exportToCSV(exportData, 'partidos');
      toast.success('Partidos exportados a CSV exitosamente');
    } catch (error) {
      toast.error('Error al exportar a CSV');
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredMatches.map((match) => ({
        ID: match.id,
        Cancha: match.court_name || 'N/A',
        'Fecha Inicio': match.start_time ? format(new Date(match.start_time), 'dd/MM/yyyy HH:mm') : 'N/A',
        'Fecha Fin': match.end_time ? format(new Date(match.end_time), 'dd/MM/yyyy HH:mm') : 'N/A',
        Estado: STATUS_LABELS[match.status] || match.status,
        Marcador: match.score || 'N/A',
        Jugadores: match.players.map((p) => p.name).join(', '),
        'Creador': match.creator_name || 'N/A',
      }));
      exportToExcel(exportData, 'partidos');
      toast.success('Partidos exportados a Excel exitosamente');
    } catch (error) {
      toast.error('Error al exportar a Excel');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Cargando partidos..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        title="Error al cargar partidos"
        message="No se pudieron cargar los partidos. Por favor, intenta más tarde."
        onRetry={() => refetch()}
      />
    );
  }

  // Si no hay matches y el usuario tiene club_id, puede ser que el endpoint no esté disponible para admins de club
  if (matches.length === 0 && user?.club_id) {
    return (
      <Box>
        <Breadcrumbs items={[
          { label: 'Inicio', path: '/' },
          { label: 'Partidos' },
        ]} />
        <Typography variant="h3" fontWeight={900} gutterBottom sx={{ color: 'primary.main', mb: 4, fontSize: { xs: '1.75rem', sm: '2.5rem' } }}>
          Partidos Completados
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay partidos registrados en tu club o el acceso a esta funcionalidad no está disponible.
        </Alert>
        <EmptyState
          title="No hay partidos disponibles"
          message="Los partidos completados aparecerán aquí cuando se registren en tu club."
          icon={<SportsIcon sx={{ fontSize: 64 }} />}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs items={[
        { label: 'Inicio', path: '/' },
        { label: 'Partidos' },
      ]} />
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Typography variant="h3" fontWeight={900} sx={{ color: 'primary.main', fontSize: { xs: '1.75rem', sm: '2.5rem' } }}>
          Partidos Completados
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCSV}
            disabled={filteredMatches.length === 0}
          >
            Exportar CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={filteredMatches.length === 0}
          >
            Exportar Excel
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por jugador o cancha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Estado</InputLabel>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Estado">
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="completed">Completado</MenuItem>
              <MenuItem value="in_progress">En Progreso</MenuItem>
              <MenuItem value="cancelled">Cancelado</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Cancha</InputLabel>
            <Select value={filterCourt} onChange={(e) => setFilterCourt(e.target.value)} label="Cancha">
              <MenuItem value="">Todas</MenuItem>
              {courts.map((court) => (
                <MenuItem key={court.id} value={court.id.toString()}>
                  {court.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Fecha Desde"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Fecha Hasta"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Paper>

      {/* Tabla de partidos */}
      {filteredMatches.length === 0 ? (
        <EmptyState
          title="No se encontraron partidos"
          message="Intenta ajustar los filtros de búsqueda."
          icon={<SportsIcon sx={{ fontSize: 64 }} />}
        />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Cancha</TableCell>
                  <TableCell>Fecha y Hora</TableCell>
                  <TableCell>Jugadores</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Marcador</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMatches.map((match) => (
                  <TableRow key={match.id} hover>
                    <TableCell>{match.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlaceIcon fontSize="small" color="action" />
                        {match.court_name || 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {match.start_time
                        ? format(new Date(match.start_time), 'dd/MM/yyyy HH:mm')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        {match.players.length} jugador{match.players.length !== 1 ? 'es' : ''}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[match.status] || match.status}
                        color={STATUS_COLORS[match.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{match.score || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewDetails(match)} color="primary">
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredMatches.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
          />
        </>
      )}

      {/* Diálogo de detalles */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsIcon />
            Detalles del Partido #{selectedMatch?.id}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMatch && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cancha
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedMatch.court_name || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Fecha y Hora
                </Typography>
                <Typography variant="body1">
                  Inicio: {selectedMatch.start_time ? format(new Date(selectedMatch.start_time), 'dd/MM/yyyy HH:mm') : 'N/A'}
                </Typography>
                <Typography variant="body1">
                  Fin: {selectedMatch.end_time ? format(new Date(selectedMatch.end_time), 'dd/MM/yyyy HH:mm') : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Estado
                </Typography>
                <Chip
                  label={STATUS_LABELS[selectedMatch.status] || selectedMatch.status}
                  color={STATUS_COLORS[selectedMatch.status] || 'default'}
                />
              </Box>

              {selectedMatch.score && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Marcador
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedMatch.score}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Jugadores ({selectedMatch.players.length})
              </Typography>
              <List>
                {selectedMatch.players.map((player, index) => (
                  <ListItem key={player.id}>
                    <ListItemText
                      primary={player.name}
                      secondary={
                        <Box>
                          {player.email}
                          {player.gender && ` • ${player.gender}`}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {selectedMatch.creator_name && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Creador
                    </Typography>
                    <Typography variant="body1">{selectedMatch.creator_name}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
