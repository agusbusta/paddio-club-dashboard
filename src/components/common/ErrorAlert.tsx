import React from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  severity?: 'error' | 'warning' | 'info';
  fullWidth?: boolean;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Error',
  message,
  onRetry,
  severity = 'error',
  fullWidth = false,
}) => {
  return (
    <Alert
      severity={severity}
      icon={<ErrorIcon />}
      sx={{
        width: fullWidth ? '100%' : 'auto',
        mb: 2,
      }}
      action={
        onRetry && (
          <Button
            color="inherit"
            size="small"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
          >
            Reintentar
          </Button>
        )
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
};
