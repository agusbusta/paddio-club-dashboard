import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Turnos } from './pages/Turnos';
import { Canchas } from './pages/Canchas';
import { Configuracion } from './pages/Configuracion';
import { ChangePassword } from './pages/ChangePassword';

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
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.5px',
      color: '#0A2239',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
      letterSpacing: '-0.3px',
      color: '#0A2239',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
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
          padding: '10px 20px',
          fontWeight: 700,
          fontSize: '1rem',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(91,225,44,0.10)',
            transform: 'scale(1.04)',
          },
        },
        contained: {
          '&:hover': {
            backgroundColor: '#2E7D32',
          },
        },
        outlined: {
          borderColor: '#5BE12C',
          color: '#5BE12C',
          '&:hover': {
            borderColor: '#2E7D32',
            backgroundColor: 'rgba(91,225,44,0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 24px rgba(10,34,57,0.06)',
          borderRadius: 16,
          transition: 'box-shadow 0.3s',
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
          '&.Mui-selected': {
            color: '#5BE12C',
          },
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
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/turnos" element={<Turnos />} />
              <Route path="/canchas" element={<Canchas />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Routes>
          </MainLayout>
        </Router>
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
