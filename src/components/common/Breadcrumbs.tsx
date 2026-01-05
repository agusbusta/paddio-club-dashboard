import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Si no se proporcionan items, generar automáticamente desde la ruta
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const result: BreadcrumbItem[] = [{ label: 'Inicio', path: '/' }];
    
    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const label = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      result.push({ label, path: currentPath });
    });
    
    return result;
  })();

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        if (isLast || !item.path) {
          return (
            <Typography key={item.label} color="text.primary" variant="body2">
              {index === 0 && <HomeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />}
              {item.label}
            </Typography>
          );
        }
        
        return (
          <Link
            key={item.label}
            component="button"
            variant="body2"
            onClick={() => navigate(item.path!)}
            sx={{
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {index === 0 && <HomeIcon sx={{ fontSize: 16 }} />}
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};
