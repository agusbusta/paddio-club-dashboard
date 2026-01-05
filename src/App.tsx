import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { PushNotificationsProvider } from './components/common/PushNotificationsProvider';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Turnos = lazy(() => import('./pages/Turnos').then(module => ({ default: module.Turnos })));
const TurnosCrear = lazy(() => import('./pages/TurnosCrear').then(module => ({ default: module.TurnosCrear })));
const TurnosCalendar = lazy(() => import('./pages/TurnosCalendar').then(module => ({ default: module.TurnosCalendar })));
const TurnosPendientes = lazy(() => import('./pages/TurnosPendientes').then(module => ({ default: module.TurnosPendientes })));
const TurnosHistorial = lazy(() => import('./pages/TurnosHistorial').then(module => ({ default: module.TurnosHistorial })));
const Canchas = lazy(() => import('./pages/Canchas').then(module => ({ default: module.Canchas })));
const Configuracion = lazy(() => import('./pages/Configuracion').then(module => ({ default: module.Configuracion })));
const ChangePassword = lazy(() => import('./pages/ChangePassword').then(module => ({ default: module.ChangePassword })));
const Estadisticas = lazy(() => import('./pages/Estadisticas').then(module => ({ default: module.Estadisticas })));
const Partidos = lazy(() => import('./pages/Partidos').then(module => ({ default: module.Partidos })));
const Notificaciones = lazy(() => import('./pages/Notificaciones').then(module => ({ default: module.Notificaciones })));
const TurnoDetalle = lazy(() => import('./pages/TurnoDetalle').then(module => ({ default: module.TurnoDetalle })));

// Paleta inspirada en la app móvil de Paddio
const theme = createTheme({
  palette: {
    primary: {
      main: '#5BE12C', // Verde vibrante
      light: '#7FFF50',
      dark: '#2E7D32',
      contrastText: '#fff',
    },
    secondary: {
      main: '#0A2239', // Azul oscuro casi negro
      light: '#1B3358',
      dark: '#000A16',
      contrastText: '#fff',
    },
    background: {
      default: '#F8F9FA', // Blanco/gris muy claro
      paper: '#fff',
    },
    text: {
      primary: '#0A2239', // Azul oscuro
      secondary: '#5D6D7E',
    },
    success: {
      main: '#5BE12C',
      contrastText: '#fff',
    },
    info: {
      main: '#1B3358',
      contrastText: '#fff',
    },
    divider: '#E5E9F2',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 900,
      letterSpacing: '-0.5px',
      color: '#0A2239',
    },
    h2: {
      fontWeight: 900,
      letterSpacing: '-0.5px',
      color: '#0A2239',
    },
    h3: {
      fontWeight: 900,
      letterSpacing: '-0.5px',
      color: '#0A2239',
    },
    h4: {
      fontWeight: 900,
      fontSize: '1.75rem',
      letterSpacing: '-0.5px',
      color: '#0A2239',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.3px',
      color: '#0A2239',
    },
    h6: {
      fontWeight: 700,
      fontSize: '1.1rem',
      letterSpacing: '-0.3px',
      color: '#0A2239',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 700,
          fontSize: '1rem',
          textTransform: 'none',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
          boxShadow: '0 4px 16px rgba(91, 225, 44, 0.4)',
          color: '#fff',
          '&:hover': {
            background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
            boxShadow: '0 6px 20px rgba(91, 225, 44, 0.5)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&.Mui-disabled': {
            background: '#ccc',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: '#5BE12C',
          color: '#5BE12C',
          borderWidth: 2,
          '&:hover': {
            borderColor: '#2E7D32',
            backgroundColor: 'rgba(91, 225, 44, 0.08)',
            borderWidth: 2,
            transform: 'translateY(-2px)',
          },
        },
        text: {
          color: '#5BE12C',
          '&:hover': {
            backgroundColor: 'rgba(91, 225, 44, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          borderRadius: 16,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          },
        },
        elevation1: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        },
        elevation2: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        },
        elevation3: {
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A2239',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(10,34,57,0.10)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fff',
          borderRight: '1px solid #E5E9F2',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          transition: 'background 0.2s, color 0.2s',
          '&.Mui-selected': {
            backgroundColor: 'rgba(91,225,44,0.10)',
            color: '#5BE12C',
            '&:hover': {
              backgroundColor: 'rgba(91,225,44,0.16)',
            },
            '& .MuiListItemIcon-root': {
              color: '#5BE12C',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(91,225,44,0.06)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#5D6D7E',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.95rem',
          '&.Mui-selected': {
            color: '#5BE12C',
            fontWeight: 900,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover fieldset': {
              borderColor: '#5BE12C',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#5BE12C',
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#5BE12C',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          borderRadius: 16,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
          color: '#fff',
        },
      },
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <AuthProvider>
            <PushNotificationsProvider>
              <Router>
            <Suspense fallback={<LoadingSpinner fullScreen message="Cargando..." />}>
              <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<Login />} />
                
                {/* Rutas protegidas */}
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Home />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/turnos"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Turnos />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/turnos/crear"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <TurnosCrear />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/turnos/calendario"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <TurnosCalendar />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/turnos/pendientes"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <TurnosPendientes />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/turnos/historial"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <TurnosHistorial />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/turnos/:turnId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <TurnoDetalle />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/canchas"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Canchas />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estadisticas"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Estadisticas />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Configuracion />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partidos"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Partidos />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notificaciones"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Notificaciones />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Redirigir cualquier ruta desconocida al login */}
              <Route path="*" element={<Login />} />
              </Routes>
                    </Suspense>
              </Router>
            </PushNotificationsProvider>
          </AuthProvider>
        </LocalizationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#fff',
              color: '#0A2239',
              boxShadow: '0 4px 24px rgba(10,34,57,0.10)',
              borderRadius: 12,
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
