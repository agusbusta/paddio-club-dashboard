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
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService, ChangePasswordData } from '../services/auth';
import toast from 'react-hot-toast';

export const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ChangePasswordData>({
    current_password: '',
    new_password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.current_password) {
      newErrors.current_password = 'La contraseña actual es requerida';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'La nueva contraseña es requerida';
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (formData.new_password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'La nueva contraseña debe ser diferente a la actual';
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
      await authService.changePassword(formData);
      toast.success('Contraseña cambiada exitosamente');
      // Redirigir al home después de cambiar la contraseña
      navigate('/');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || 'Error al cambiar la contraseña';
      toast.error(errorMessage);
      if (errorMessage.includes('Current password is incorrect')) {
        setErrors({ current_password: 'La contraseña actual es incorrecta' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Cambiar Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Por seguridad, cambia tu contraseña por defecto
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Esta es la primera vez que inicias sesión. Por favor, cambia tu
            contraseña por defecto por una contraseña segura.
          </Alert>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Contraseña Actual"
              type="password"
              value={formData.current_password}
              onChange={(e) =>
                setFormData({ ...formData, current_password: e.target.value })
              }
              error={!!errors.current_password}
              helperText={errors.current_password}
              margin="normal"
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="Nueva Contraseña"
              type="password"
              value={formData.new_password}
              onChange={(e) =>
                setFormData({ ...formData, new_password: e.target.value })
              }
              error={!!errors.new_password}
              helperText={errors.new_password}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Confirmar Nueva Contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 3,
                py: 1.5,
                fontWeight: 'bold',
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
