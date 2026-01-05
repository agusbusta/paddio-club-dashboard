import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 6,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          color: 'text.secondary',
          fontSize: 64,
          mb: 2,
        }}
      >
        {icon || <InboxIcon sx={{ fontSize: 64 }} />}
      </Box>
      <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          {message}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};
