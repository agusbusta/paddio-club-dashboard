import React, { useState, useRef } from 'react';
import { Box, Typography, Paper, Chip, Avatar, Button, Modal, Fade, Backdrop, IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Autocomplete, TextField, MenuItem, Select } from '@mui/material';
import { AccessTime, Group, CheckCircle, HourglassEmpty, Close, Delete } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Mock data de turnos (ahora en estado)
interface Jugador {
  nombre: string;
  avatar: string;
  ladoCancha: 'izquierda' | 'derecha';
  rol: 'drive' | 'reves';
}
interface Turno {
  id: number;
  hora: string;
  estado: 'completo' | 'incompleto' | 'libre';
  jugadores: Jugador[];
  alquila: string | null;
}

// Utilidad para asignar lado y rol automáticamente
function asignarLadosYRoles(jugadores: Omit<Jugador, 'ladoCancha' | 'rol'>[]): Jugador[] {
  const posiciones: { ladoCancha: 'izquierda' | 'derecha'; rol: 'drive' | 'reves' }[] = [
    { ladoCancha: 'izquierda', rol: 'drive' },
    { ladoCancha: 'izquierda', rol: 'reves' },
    { ladoCancha: 'derecha', rol: 'drive' },
    { ladoCancha: 'derecha', rol: 'reves' },
  ];
  return jugadores.slice(0, 4).map((j, idx) => ({ ...j, ...posiciones[idx] }));
}

const initialTurnos: Turno[] = [
  {
    id: 1,
    hora: '09:00',
    estado: 'completo',
    jugadores: asignarLadosYRoles([
      { nombre: 'Juan', avatar: 'J' },
      { nombre: 'Pedro', avatar: 'P' },
      { nombre: 'Lucas', avatar: 'L' },
      { nombre: 'Marcos', avatar: 'M' },
    ]),
    alquila: 'Juan',
  },
  {
    id: 2,
    hora: '10:00',
    estado: 'incompleto',
    jugadores: asignarLadosYRoles([
      { nombre: 'Ana', avatar: 'A' },
      { nombre: 'Sofía', avatar: 'S' },
    ]),
    alquila: 'Ana',
  },
  {
    id: 3,
    hora: '11:00',
    estado: 'libre',
    jugadores: [],
    alquila: null,
  },
];

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

// Mock de jugadores disponibles
const jugadoresDisponibles = [
  { id: 'P001', nombre: 'Martín Gómez' },
  { id: 'P002', nombre: 'Lucas Fernández' },
  { id: 'P003', nombre: 'Santiago Pérez' },
  { id: 'P004', nombre: 'Juan Cruz' },
  { id: 'P005', nombre: 'Pedro López' },
  { id: 'P006', nombre: 'Matías Díaz' },
  { id: 'P007', nombre: 'Agustina Torres' },
  { id: 'P008', nombre: 'Sofía Martínez' },
];

function CanchaPadel3D({ jugadores, hoveredJugador }: { jugadores: any[], hoveredJugador: string | null }) {
  // Colores para lados
  const colorA = '#0A2239'; // azul app
  const colorB = '#5BE12C'; // verde app
  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', my: 3 }}>
      <svg width="320" height="180" viewBox="0 0 320 180">
        <defs>
          <linearGradient id="courtGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e3eaf6" />
            <stop offset="100%" stopColor="#f7fafd" />
          </linearGradient>
        </defs>
        {/* Fondo lado A */}
        <rect x="20" y="20" width="140" height="140" rx="32" fill={colorA} opacity="0.45" />
        {/* Fondo lado B */}
        <rect x="160" y="20" width="140" height="140" rx="32" fill={colorB} opacity="0.45" />
        {/* Etiquetas de lado (siempre visibles, antes de la cancha y avatares) */}
        <g>
          <rect x="35" y="28" width="110" height="36" rx="18" fill="#fff" opacity="0.92" />
          <text x="90" y="53" textAnchor="middle" fontSize="18" fill="#0A2239" fontWeight="bold">Lado A</text>
        </g>
        <g>
          <rect x="175" y="28" width="110" height="36" rx="18" fill="#fff" opacity="0.92" />
          <text x="230" y="53" textAnchor="middle" fontSize="18" fill="#0A2239" fontWeight="bold">Lado B</text>
        </g>
        {/* Cancha y líneas */}
        <rect x="20" y="20" width="280" height="140" rx="32" fill="url(#courtGradient)" stroke="#0A2239" strokeWidth="4" filter="url(#shadow)" />
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0A2239" floodOpacity="0.10" />
        </filter>
        <line x1="160" y1="20" x2="160" y2="160" stroke="#0A2239" strokeWidth="2" strokeDasharray="6 4" />
        <rect x="155" y="85" width="10" height="10" fill="#0A2239" rx="2" />
        {/* Avatares con glow si hovered */}
        {jugadores[0] && (
          <g>
            <circle cx="60" cy="120" r="22" fill="#fff" filter="url(#shadow)" />
            <circle
              cx="60" cy="120" r="18"
              fill={jugadores[0].ladoCancha === 'izquierda' ? colorA : colorB}
              stroke="#fff" strokeWidth="3"
              style={hoveredJugador === jugadores[0].nombre ? {
                filter: `drop-shadow(0 0 8px ${jugadores[0].ladoCancha === 'izquierda' ? colorA : colorB}) drop-shadow(0 0 16px ${jugadores[0].ladoCancha === 'izquierda' ? colorA : colorB})`
              } : {}}
            />
            <text x="60" y="126" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="bold">{jugadores[0].avatar}</text>
          </g>
        )}
        {jugadores[1] && (
          <g>
            <circle cx="60" cy="60" r="22" fill="#fff" filter="url(#shadow)" />
            <circle
              cx="60" cy="60" r="18"
              fill={jugadores[1].ladoCancha === 'izquierda' ? colorA : colorB}
              stroke="#fff" strokeWidth="3"
              style={hoveredJugador === jugadores[1].nombre ? {
                filter: `drop-shadow(0 0 8px ${jugadores[1].ladoCancha === 'izquierda' ? colorA : colorB}) drop-shadow(0 0 16px ${jugadores[1].ladoCancha === 'izquierda' ? colorA : colorB})`
              } : {}}
            />
            <text x="60" y="66" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="bold">{jugadores[1].avatar}</text>
          </g>
        )}
        {jugadores[2] && (
          <g>
            <circle cx="260" cy="120" r="22" fill="#fff" filter="url(#shadow)" />
            <circle
              cx="260" cy="120" r="18"
              fill={jugadores[2].ladoCancha === 'izquierda' ? colorA : colorB}
              stroke="#fff" strokeWidth="3"
              style={hoveredJugador === jugadores[2].nombre ? {
                filter: `drop-shadow(0 0 8px ${jugadores[2].ladoCancha === 'izquierda' ? colorA : colorB}) drop-shadow(0 0 16px ${jugadores[2].ladoCancha === 'izquierda' ? colorA : colorB})`
              } : {}}
            />
            <text x="260" y="126" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="bold">{jugadores[2].avatar}</text>
          </g>
        )}
        {jugadores[3] && (
          <g>
            <circle cx="260" cy="60" r="22" fill="#fff" filter="url(#shadow)" />
            <circle
              cx="260" cy="60" r="18"
              fill={jugadores[3].ladoCancha === 'izquierda' ? colorA : colorB}
              stroke="#fff" strokeWidth="3"
              style={hoveredJugador === jugadores[3].nombre ? {
                filter: `drop-shadow(0 0 8px ${jugadores[3].ladoCancha === 'izquierda' ? colorA : colorB}) drop-shadow(0 0 16px ${jugadores[3].ladoCancha === 'izquierda' ? colorA : colorB})`
              } : {}}
            />
            <text x="260" y="66" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="bold">{jugadores[3].avatar}</text>
          </g>
        )}
      </svg>
    </Box>
  );
}

// Función para cambiar lado o rol de un jugador, con validación e intercambio si es necesario
function cambiarLadoORol(turnos: Turno[], turnoId: number, jugadorNombre: string, campo: 'ladoCancha' | 'rol', valor: 'izquierda' | 'derecha' | 'drive' | 'reves'): Turno[] {
  return turnos.map(t => {
    if (t.id !== turnoId) return t;
    const idx = t.jugadores.findIndex(j => j.nombre === jugadorNombre);
    if (idx === -1) return t;
    const jugador = t.jugadores[idx];
    if (campo === 'ladoCancha') {
      // Ver si ya hay drive/reves en ese lado
      const mismoRol = t.jugadores.find(j => j.ladoCancha === valor && j.rol === jugador.rol);
      if (mismoRol) {
        // Intercambiar roles, pero solo rol, no ladoCancha
        return {
          ...t,
          jugadores: t.jugadores.map(j => {
            if (j.nombre === jugadorNombre) return { ...j, ladoCancha: valor as 'izquierda' | 'derecha' };
            if (j.nombre === mismoRol.nombre) return { ...j };
            return j;
          })
        };
      } else {
        return {
          ...t,
          jugadores: t.jugadores.map(j => j.nombre === jugadorNombre ? { ...j, ladoCancha: valor as 'izquierda' | 'derecha' } : j)
        };
      }
    }
    if (campo === 'rol') {
      const mismoRol = t.jugadores.find(j => j.ladoCancha === jugador.ladoCancha && j.rol === valor);
      if (mismoRol) {
        // Intercambiar roles
        return {
          ...t,
          jugadores: t.jugadores.map(j => {
            if (j.nombre === jugadorNombre) return { ...j, rol: valor as 'drive' | 'reves' };
            if (j.nombre === mismoRol.nombre) return { ...j, rol: jugador.rol };
            return j;
          })
        };
      } else {
        return {
          ...t,
          jugadores: t.jugadores.map(j => j.nombre === jugadorNombre ? { ...j, rol: valor as 'drive' | 'reves' } : j)
        };
      }
    }
    return t;
  });
}

// Utilidad para obtener el orden correcto de posiciones
const posicionesOrden = [
  { ladoCancha: 'izquierda', rol: 'drive' },
  { ladoCancha: 'izquierda', rol: 'reves' },
  { ladoCancha: 'derecha', rol: 'drive' },
  { ladoCancha: 'derecha', rol: 'reves' },
];

// Utilidad para mover jugador en la lista drag & drop
function moverJugadorDnD(turnos: Turno[], turnoId: number, sourceIdx: number, destIdx: number): Turno[] {
  return turnos.map(t => {
    if (t.id !== turnoId) return t;
    const slots = posicionesOrden.map(pos => t.jugadores.find(j => j.ladoCancha === pos.ladoCancha && j.rol === pos.rol) || null);
    const jugador = slots[sourceIdx];
    if (!jugador) return t;
    const destinoJugador = slots[destIdx];
    const destinoPos = posicionesOrden[destIdx];
    let nuevosJugadores = [...t.jugadores];
    if (destinoJugador) {
      nuevosJugadores = nuevosJugadores.map(j => {
        if (j.nombre === jugador.nombre) return { ...j, ladoCancha: destinoPos.ladoCancha as 'izquierda' | 'derecha', rol: destinoPos.rol as 'drive' | 'reves' };
        if (j.nombre === destinoJugador.nombre) return { ...j, ladoCancha: posicionesOrden[sourceIdx].ladoCancha as 'izquierda' | 'derecha', rol: posicionesOrden[sourceIdx].rol as 'drive' | 'reves' };
        return j;
      });
    } else {
      nuevosJugadores = nuevosJugadores.map(j =>
        j.nombre === jugador.nombre ? { ...j, ladoCancha: destinoPos.ladoCancha as 'izquierda' | 'derecha', rol: destinoPos.rol as 'drive' | 'reves' } : j
      );
    }
    return { ...t, jugadores: nuevosJugadores };
  });
}

const TurnosDelDiaSection: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>(initialTurnos);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [turnoToClean, setTurnoToClean] = useState<number | null>(null);
  const [inputOpen, setInputOpen] = useState<{ turnoId: number; idx: number } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [autocompleteValue, setAutocompleteValue] = useState<any>(null);
  const [pendingAdd, setPendingAdd] = useState<{ turnoId: number; idx: number; jugador: any } | null>(null);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [hoveredJugador, setHoveredJugador] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleOpen = (turno: any) => {
    setSelected(turno);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // Eliminar jugador individual
  const handleRemoveJugador = (turnoId: number, jugadorNombre: string) => {
    setTurnos(prev => prev.map(t =>
      t.id === turnoId
        ? {
            ...t,
            jugadores: asignarLadosYRoles(t.jugadores.filter(j => j.nombre !== jugadorNombre)),
            estado: t.jugadores.length - 1 === 0 ? 'libre' : (t.jugadores.length - 1 === 4 ? 'completo' : 'incompleto'),
            alquila: t.jugadores.length - 1 === 0 ? null : t.alquila,
          }
        : t
    ));
  };

  // Limpiar turno (abrir confirmación)
  const handleCleanTurno = (turnoId: number) => {
    setTurnoToClean(turnoId);
    setConfirmOpen(true);
  };
  // Confirmar limpieza
  const handleConfirmClean = () => {
    if (turnoToClean !== null) {
      setTurnos(prev => prev.map(t =>
        t.id === turnoToClean
          ? { ...t, jugadores: [], estado: 'libre', alquila: null }
          : t
      ));
    }
    setConfirmOpen(false);
    setTurnoToClean(null);
  };
  // Cancelar limpieza
  const handleCancelClean = () => {
    setConfirmOpen(false);
    setTurnoToClean(null);
  };

  // Agregar jugador en la posición idx
  const handleAddJugador = (turnoId: number, idx: number, jugador: { id: string; nombre: string }) => {
    setTurnos(prev => prev.map(t => {
      if (t.id !== turnoId) return t;
      // Quitar si ya existe ese jugador en el turno
      const filtered = t.jugadores.map(j => ({ nombre: j.nombre, avatar: j.avatar } as { nombre: string; avatar: string; } )).filter(j => j.nombre !== jugador.nombre);
      // Insertar en la posición idx
      const nuevosJugadores = [...filtered];
      nuevosJugadores.splice(idx, 0, { nombre: jugador.nombre, avatar: jugador.nombre[0] });
      return {
        ...t,
        jugadores: asignarLadosYRoles(nuevosJugadores),
        estado: nuevosJugadores.length === 0 ? 'libre' : (nuevosJugadores.length === 4 ? 'completo' : 'incompleto'),
        alquila: t.alquila || jugador.nombre,
      };
    }));
    setInputOpen(null);
    setInputValue('');
    setAutocompleteValue(null);
  };

  // En vez de usar selected directamente, obtengo el turno actualizado:
  const turnoActual = selected ? turnos.find(t => t.id === selected.id) : null;

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 3, color: '#0A2239' }}>
        Turnos del Día
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 4 }}>
        {turnos.map((turno) => (
          <Paper
            key={turno.id}
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
              <Typography variant="h6" fontWeight={700} sx={{ color: '#0A2239' }}>{turno.hora} hs</Typography>
              <Chip
                label={estadoLabel[turno.estado as keyof typeof estadoLabel]}
                color={estadoColor[turno.estado as keyof typeof estadoColor] as any}
                size="small"
                icon={
                  turno.estado === 'completo' ? <CheckCircle sx={{ color: '#5BE12C' }} /> :
                  turno.estado === 'incompleto' ? <HourglassEmpty sx={{ color: '#FFC107' }} /> : <Group sx={{ color: '#0A2239' }} />
                }
                sx={{ ml: 1, fontWeight: 700, bgcolor: turno.estado === 'libre' ? '#0A2239' : undefined, color: turno.estado === 'libre' ? 'white' : undefined, px: 1.5, borderRadius: 2 }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              {turno.jugadores.length > 0 ? (
                turno.jugadores.map((j: any) => (
                  <Box key={j.nombre} sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: j.ladoCancha === 'izquierda' ? '#0A2239' : '#5BE12C', width: 36, height: 36, fontWeight: 700, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(10,34,57,0.10)' }}>{j.avatar}</Avatar>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">Sin jugadores</Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" sx={{ color: '#0A2239', borderColor: '#0A2239', fontWeight: 700, borderRadius: 3, px: 2, py: 1, background: 'rgba(10,34,57,0.04)', boxShadow: '0 2px 8px rgba(10,34,57,0.06)', transition: 'all 0.2s', '&:hover': { background: 'rgba(10,34,57,0.10)' } }} onClick={() => handleOpen(turno)}>
                Ver Detalle
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
      {/* Confirmación de limpieza */}
      <Dialog open={confirmOpen} onClose={handleCancelClean}>
        <DialogTitle>Limpiar turno</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Estás seguro que quieres quitar a todos los jugadores de este turno? Esta acción no se puede deshacer.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClean} color="primary">Cancelar</Button>
          <Button onClick={handleConfirmClean} color="error" variant="contained">Limpiar</Button>
        </DialogActions>
      </Dialog>
      {/* Confirmación de agregar jugador */}
      <Dialog open={confirmAddOpen} onClose={() => { setConfirmAddOpen(false); setPendingAdd(null); setAutocompleteValue(null); setInputValue(''); setInputOpen(null); }}>
        <DialogTitle>Agregar jugador</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Agregar a <b>{pendingAdd?.jugador?.nombre}</b> al turno?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmAddOpen(false); setPendingAdd(null); setAutocompleteValue(null); setInputValue(''); setInputOpen(null); }} color="primary">Cancelar</Button>
          <Button onClick={() => pendingAdd && handleAddJugador(pendingAdd.turnoId, pendingAdd.idx, pendingAdd.jugador)} color="success" variant="contained">Agregar</Button>
        </DialogActions>
      </Dialog>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 300 } }}
      >
        <Fade in={open}>
          <Box ref={modalRef} sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#fff',
            boxShadow: '0 16px 48px rgba(10,34,57,0.18)',
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            minWidth: 340,
            maxWidth: 420,
            outline: 'none',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight={900} sx={{ color: '#0A2239', letterSpacing: '-1px' }}>
                Detalle del Turno
              </Typography>
              <IconButton onClick={handleClose} sx={{ color: '#0A2239', transition: 'color 0.2s', '&:hover': { color: '#5BE12C' } }}>
                <Close />
              </IconButton>
            </Box>
            {turnoActual && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccessTime sx={{ color: '#0A2239', fontSize: 22 }} />
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#0A2239', fontSize: 22 }}>{turnoActual.hora} hs</Typography>
                  <Chip
                    label={estadoLabel[turnoActual.estado as keyof typeof estadoLabel]}
                    color={estadoColor[turnoActual.estado as keyof typeof estadoColor] as any}
                    size="small"
                    icon={
                      turnoActual.estado === 'completo' ? <CheckCircle sx={{ color: '#5BE12C' }} /> :
                      turnoActual.estado === 'incompleto' ? <HourglassEmpty sx={{ color: '#FFC107' }} /> : <Group sx={{ color: '#0A2239' }} />
                    }
                    sx={{ ml: 1, fontWeight: 700, bgcolor: turnoActual.estado === 'libre' ? '#0A2239' : undefined, color: turnoActual.estado === 'libre' ? 'white' : undefined, px: 1.5, borderRadius: 2 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {turnoActual.estado === 'completo' && (
                    <>Alquila: <b>{turnoActual.alquila}</b></>
                  )}
                  {turnoActual.estado === 'incompleto' && (
                    <>Alquila: <b>{turnoActual.alquila}</b> — Faltan <b>{4 - turnoActual.jugadores.length}</b> jugadores</>
                  )}
                  {turnoActual.estado === 'libre' && (
                    <>Turno disponible para reservar</>
                  )}
                </Typography>
                <Divider sx={{ my: 2, borderColor: '#e3eaf6' }} />
                <CanchaPadel3D jugadores={turnoActual.jugadores} hoveredJugador={hoveredJugador} />
                <Divider sx={{ my: 2, borderColor: '#e3eaf6' }} />
                <DragDropContext
                  onDragUpdate={update => {
                    setDragOverIdx(update.destination?.index ?? null);
                  }}
                  onDragEnd={result => {
                    setDragOverIdx(null);
                    const destIdx = result.destination?.index;
                    if (typeof destIdx !== 'number') return;
                    if (result.source.index === destIdx) return;
                    setTurnos(turnos => moverJugadorDnD(turnos, turnoActual.id, result.source.index, destIdx));
                  }}
                >
                  <Droppable droppableId={`turno-${turnoActual.id}-slots`}>
                    {(provided, snapshot) => (
                      <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        {posicionesOrden.map((pos, idx) => {
                          const jugador = turnoActual.jugadores.find(j => j.ladoCancha === pos.ladoCancha && j.rol === pos.rol);
                          return (
                            <Draggable key={jugador ? jugador.nombre : `slot-${pos.ladoCancha}-${pos.rol}`} draggableId={jugador ? jugador.nombre : `slot-${pos.ladoCancha}-${pos.rol}`} index={idx} isDragDisabled={!jugador}>
                              {(provided, snapshot) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{
                                    display: 'flex', alignItems: 'center', gap: 1, mb: 0.5,
                                    background: dragOverIdx === idx ? 'rgba(90,225,44,0.12)' : 'transparent',
                                    borderRadius: 2,
                                    boxShadow: snapshot.isDragging ? '0 4px 16px rgba(10,34,57,0.10)' : 'none',
                                    cursor: jugador ? 'grab' : 'default',
                                    opacity: jugador ? 1 : 0.7,
                                    transition: 'background 0.2s, box-shadow 0.2s',
                                    border: dragOverIdx === idx ? '2px solid #5BE12C' : '2px solid transparent',
                                  }}
                                  onMouseEnter={() => jugador && setHoveredJugador(jugador.nombre)}
                                  onMouseLeave={() => setHoveredJugador(null)}
                                >
                                  {jugador ? (
                                    <>
                                      <Avatar sx={{ bgcolor: jugador.ladoCancha === 'izquierda' ? '#0A2239' : '#5BE12C', width: 32, height: 32, fontWeight: 700, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(10,34,57,0.10)', cursor: 'pointer' }}>{jugador.avatar}</Avatar>
                                      <Typography variant="body2" fontWeight={700} sx={{ color: '#0A2239' }}>{jugador.nombre}</Typography>
                                      <Select
                                        value={jugador.rol}
                                        size="small"
                                        onChange={e => setTurnos(turnos => cambiarLadoORol(turnos, turnoActual.id, jugador.nombre, 'rol', e.target.value as 'drive' | 'reves'))}
                                        sx={{
                                          bgcolor: jugador.rol === 'drive' ? '#0A2239' : '#5BE12C',
                                          color: 'white',
                                          fontWeight: 700,
                                          fontSize: 13,
                                          px: 1.2,
                                          borderRadius: 2,
                                          height: 32,
                                          minWidth: 80,
                                          boxShadow: 'none',
                                          '.MuiOutlinedInput-notchedOutline': { border: 0 },
                                          '& .MuiSelect-icon': { color: 'white' },
                                        }}
                                      >
                                        <MenuItem value="drive">Drive</MenuItem>
                                        <MenuItem value="reves">Revés</MenuItem>
                                      </Select>
                                      <Select
                                        value={jugador.ladoCancha}
                                        size="small"
                                        onChange={e => setTurnos(turnos => cambiarLadoORol(turnos, turnoActual.id, jugador.nombre, 'ladoCancha', e.target.value as 'izquierda' | 'derecha'))}
                                        sx={{
                                          bgcolor: jugador.ladoCancha === 'izquierda' ? '#e3eaf6' : '#e6fae3',
                                          color: '#0A2239',
                                          fontWeight: 700,
                                          fontSize: 13,
                                          px: 1.2,
                                          borderRadius: 2,
                                          height: 32,
                                          minWidth: 90,
                                          opacity: 0.85,
                                          boxShadow: 'none',
                                          '.MuiOutlinedInput-notchedOutline': { border: 0 },
                                          '& .MuiSelect-icon': { color: '#0A2239' },
                                        }}
                                      >
                                        <MenuItem value="izquierda" disabled={turnoActual.jugadores.filter(j => j.ladoCancha === 'izquierda').length >= 2 && jugador.ladoCancha !== 'izquierda'}>Lado A</MenuItem>
                                        <MenuItem value="derecha" disabled={turnoActual.jugadores.filter(j => j.ladoCancha === 'derecha').length >= 2 && jugador.ladoCancha !== 'derecha'}>Lado B</MenuItem>
                                      </Select>
                                      <IconButton 
                                        size="small" 
                                        sx={{ ml: 'auto', color: '#f44336', '&:hover': { bgcolor: '#f44336', color: '#fff' } }} 
                                        onClick={() => handleRemoveJugador(turnoActual.id, jugador.nombre)}
                                      >
                                        <Close fontSize="small" />
                                      </IconButton>
                                    </>
                                  ) : (
                                    <Draggable key={`slot-${pos.ladoCancha}-${pos.rol}`} draggableId={`slot-${pos.ladoCancha}-${pos.rol}`} index={idx} isDragDisabled={true}>
                                      {(provided) => (
                                        <Box
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          sx={{
                                            display: 'flex', alignItems: 'center', gap: 1, mb: 0.5,
                                            background: dragOverIdx === idx ? 'rgba(90,225,44,0.12)' : 'transparent',
                                            borderRadius: 2,
                                            border: dragOverIdx === idx ? '2px solid #5BE12C' : '2px solid transparent',
                                            transition: 'background 0.2s, box-shadow 0.2s',
                                          }}
                                        >
                                          {inputOpen && inputOpen.turnoId === turnoActual.id && inputOpen.idx === idx ? (
                                            <Autocomplete
                                              size="small"
                                              options={jugadoresDisponibles}
                                              getOptionLabel={option => `${option.nombre} (${option.id})`}
                                              inputValue={inputValue}
                                              value={autocompleteValue}
                                              onInputChange={(_, value) => setInputValue(value)}
                                              onChange={(_, value) => {
                                                if (value) handleAddJugador(turnoActual.id, idx, value);
                                              }}
                                              isOptionEqualToValue={(option, value) => option.id === value.id}
                                              renderInput={(params) => (
                                                <TextField {...params} label="Buscar jugador" autoFocus onBlur={() => setInputOpen(null)} />
                                              )}
                                              sx={{ minWidth: 220 }}
                                            />
                                          ) : (
                                            <>
                                              <Avatar sx={{ bgcolor: 'grey.200', width: 32, height: 32, fontWeight: 700, color: '#0A2239', cursor: 'pointer' }} onClick={() => setInputOpen({ turnoId: turnoActual.id, idx })}>?</Avatar>
                                              <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }} onClick={() => setInputOpen({ turnoId: turnoActual.id, idx })}>Lugar disponible</Typography>
                                            </>
                                          )}
                                        </Box>
                                      )}
                                    </Draggable>
                                  )}
                                </Box>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>
                {turnoActual.jugadores.length > 0 && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small" 
                      startIcon={<Delete />}
                      onClick={() => handleCleanTurno(turnoActual.id)}
                      sx={{ borderRadius: 3, px: 2, py: 1, fontWeight: 700 }}
                    >
                      Limpiar turno
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default TurnosDelDiaSection; 