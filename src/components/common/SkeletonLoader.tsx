import React from 'react';
import { Box, Skeleton } from '@mui/material';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'table' | 'stat';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  count = 1,
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" height={24} />
          </Box>
        );
      case 'list':
        return (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
          </Box>
        );
      case 'table':
        return (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
          </Box>
        );
      case 'stat':
        return (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width={80} height={40} />
            </Box>
            <Skeleton variant="text" width="70%" height={28} />
            <Skeleton variant="text" width="50%" height={20} />
          </Box>
        );
      default:
        return <Skeleton variant="rectangular" height={200} />;
    }
  };

  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index}>{renderSkeleton()}</Box>
      ))}
    </Box>
  );
};
