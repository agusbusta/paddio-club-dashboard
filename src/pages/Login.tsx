import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Si ya está autenticado, redirigir
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Mostrar mensaje de éxito si viene de cambio de contraseña
  React.useEffect(() => {
    const message = (location.state as any)?.message;
    if (message) {
      setSuccessMessage(message);
      toast.success(message);
    }
  }, [location.state]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({
        username: formData.email,
        password: formData.password,
      });

      // Si debe cambiar la contraseña, redirigir a la página de cambio de contraseña
      if (response.user?.must_change_password) {
        navigate('/change-password', { replace: true });
        return;
      }

      toast.success('¡Bienvenido!');
      
      // Verificar que el token esté en localStorage antes de navegar
      const tokenBeforeNav = localStorage.getItem('token');
      const userBeforeNav = localStorage.getItem('user');
      console.log('🔍 [LOGIN] Antes de navegar - Token:', tokenBeforeNav ? 'OK' : 'ERROR');
      console.log('🔍 [LOGIN] Antes de navegar - User:', userBeforeNav ? 'OK' : 'ERROR');
      
      // Redirigir a la página solicitada o al home
      const from = (location.state as any)?.from?.pathname || '/';
      
      // Verificar después de un pequeño delay antes de navegar
      setTimeout(() => {
        const tokenAfterDelay = localStorage.getItem('token');
        const userAfterDelay = localStorage.getItem('user');
        console.log('🔍 [LOGIN] Después de delay antes de navegar - Token:', tokenAfterDelay ? 'OK' : 'ERROR');
        console.log('🔍 [LOGIN] Después de delay antes de navegar - User:', userAfterDelay ? 'OK' : 'ERROR');
        
        if (!tokenAfterDelay) {
          console.error('🚨 [LOGIN] CRÍTICO: El token desapareció antes de navegar!');
        }
      }, 50);
      
      navigate(from, { replace: true });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || 'Error al iniciar sesión';
      toast.error(errorMessage);
      
      if (errorMessage.includes('Incorrect email or password') || errorMessage.includes('incorrect')) {
        setErrors({
          password: 'Email o contraseña incorrectos',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A2239 0%, #1B3358 50%, #0A2239 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(91, 225, 44, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(91, 225, 44, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 5 },
            width: '100%',
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 8px 24px rgba(91, 225, 44, 0.3)',
              }}
            >
              <LockIcon sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Typography
              variant="h3"
              component="h1"
              fontWeight={900}
              gutterBottom
              sx={{
                color: '#0A2239',
                mb: 1,
                letterSpacing: '-0.5px',
              }}
            >
              Paddio Club
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#5D6D7E',
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              Dashboard de Administración
            </Typography>
          </Box>

          {successMessage && (
            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: 24,
                },
              }}
            >
              {successMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              required
              autoFocus
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
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
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#5D6D7E' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              required
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
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
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#5D6D7E' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: '#5D6D7E',
                        '&:hover': {
                          color: '#5BE12C',
                        },
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 4,
                mb: 2,
                py: 1.75,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
                boxShadow: '0 4px 16px rgba(91, 225, 44, 0.4)',
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
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </Box>

          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: '1px solid #E5E9F2',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#5D6D7E',
                fontSize: '0.875rem',
              }}
            >
              ¿Problemas para iniciar sesión?
              <br />
              <Box
                component="span"
                sx={{
                  color: '#5BE12C',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Contacta al administrador
              </Box>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
