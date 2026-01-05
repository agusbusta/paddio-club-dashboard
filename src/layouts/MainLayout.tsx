import React from 'react';
import { Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, ListItem, ListItemIcon, ListItemText, ListItemButton, Avatar, Menu, MenuItem } from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  SportsTennis as CourtIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Warning as WarningIcon,
  BarChart as BarChartIcon,
  EmojiEvents as EmojiEventsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { courtService } from '../services/courts';
import { clubService } from '../services/clubs';
import { notificationService } from '../services/notifications';
import { Badge } from '@mui/material';
import { PageTransition } from '../components/common/PageTransition';

const drawerWidth = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: 'Inicio', icon: <DashboardIcon />, path: '/' },
  { text: 'Turnos', icon: <ScheduleIcon />, path: '/turnos' },
  { text: 'Canchas', icon: <CourtIcon />, path: '/canchas' },
  { text: 'Partidos', icon: <EmojiEventsIcon />, path: '/partidos' },
  { text: 'Notificaciones', icon: <NotificationsIcon />, path: '/notificaciones' },
  { text: 'Estadísticas', icon: <BarChartIcon />, path: '/estadisticas' },
  { text: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Consultar canchas para mostrar indicador si no hay
  const { data: courts = [] } = useQuery({
    queryKey: ['courts', user?.club_id],
    queryFn: () => courtService.getCourts(),
    enabled: !!user?.club_id,
    refetchOnWindowFocus: false,
    select: (data) => {
      // Filtrar canchas por club_id del usuario autenticado
      if (!user?.club_id) return [];
      return data.filter((court: any) => court.club_id === user.club_id);
    },
  });

  // Consultar información del club
  const { data: club } = useQuery({
    queryKey: ['club', user?.club_id],
    queryFn: () => clubService.getMyClub(user!.club_id!),
    enabled: !!user?.club_id,
    refetchOnWindowFocus: false,
  });

  // Consultar notificaciones no leídas para badge
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  const hasNoCourts = courts.length === 0;
  
  // Contar notificaciones no leídas relacionadas con turnos
  // Tipos de notificaciones relacionadas con turnos: 'turn_joined', 'turn_complete', 'external_request', etc.
  const turnRelatedNotificationTypes = ['turn_joined', 'turn_complete', 'external_request', 'turn_cancelled'];
  const unreadTurnNotificationsCount = notificationsData?.notifications?.filter(
    (notif: any) => !notif.is_read && (
      turnRelatedNotificationTypes.includes(notif.type) ||
      (notif.data?.turn_id !== undefined)
    )
  ).length || 0;
  
  const unreadNotificationsCount = notificationsData?.unread_count || 0;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        background: '#ffffff',
        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
          color: '#fff',
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 2,
          boxShadow: '0 2px 8px rgba(91, 225, 44, 0.2)',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            mr: 1.5,
            border: '1px solid rgba(255, 255, 255, 0.4)',
            flexShrink: 0,
          }}
        >
          <DashboardIcon sx={{ fontSize: 24, color: '#fff' }} />
        </Box>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontWeight: 900,
            letterSpacing: '-0.5px',
            fontSize: '1.1rem',
            color: '#fff',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          }}
        >
          Paddio Club
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)', m: 0 }} />
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isCanchas = item.text === 'Canchas';
          const isTurnos = item.text === 'Turnos';
          const isNotificaciones = item.text === 'Notificaciones';
          const showTurnosBadge = isTurnos && unreadTurnNotificationsCount > 0;
          const showNotificationsBadge = isNotificaciones && unreadNotificationsCount > 0;
          const isSelected =
            location.pathname === item.path ||
            (item.path === '/turnos' && location.pathname.startsWith('/turnos'));
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isSelected}
                sx={{
                  borderRadius: 2,
                  mx: 0.5,
                  py: 1.5,
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease-in-out',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(91, 225, 44, 0.15) 0%, rgba(46, 125, 50, 0.1) 100%)'
                    : 'transparent',
                  '&:hover': {
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(91, 225, 44, 0.2) 0%, rgba(46, 125, 50, 0.15) 100%)'
                      : 'rgba(91, 225, 44, 0.08)',
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    '& .MuiListItemIcon-root': {
                      color: '#5BE12C',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#5BE12C',
                      fontWeight: 700,
                    },
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected ? '#5BE12C' : '#5D6D7E',
                      transition: 'color 0.2s ease-in-out',
                    }}
                  >
                    {showTurnosBadge ? (
                      <Badge badgeContent={unreadTurnNotificationsCount} color="error">
                        {item.icon}
                      </Badge>
                    ) : showNotificationsBadge ? (
                      <Badge badgeContent={unreadNotificationsCount} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.95rem',
                        color: isSelected ? '#5BE12C' : '#0A2239',
                        transition: 'all 0.2s ease-in-out',
                        ...(isCanchas && hasNoCourts ? { fontWeight: 600, color: 'error.main' } : {}),
                      },
                    }}
                  />
                </Box>
                {isCanchas && hasNoCourts && (
                  <WarningIcon
                    sx={{
                      fontSize: 20,
                      color: 'error.main',
                      ml: 1,
                      animation: 'blink 1.5s infinite',
                      '@keyframes blink': {
                        '0%, 100%': {
                          opacity: 1,
                        },
                        '50%': {
                          opacity: 0.3,
                        },
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 50%, #F8F9FA 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 20s ease infinite',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(circle at 20% 50%, rgba(91, 225, 44, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(10, 34, 57, 0.02) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        },
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          zIndex: 1200,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: 'none' },
              color: '#0A2239',
              '&:hover': {
                background: 'rgba(91, 225, 44, 0.08)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.5px',
                fontSize: '1.25rem',
                color: '#0A2239',
              }}
            >
              {location.pathname === '/' 
                ? 'Dashboard' 
                : menuItems.find((item) => item.path === location.pathname)?.text || 'Paddio Club'}
            </Typography>
            {club && (
              <Typography
                variant="caption"
                sx={{
                  display: { xs: 'none', md: 'block' },
                  color: '#5D6D7E',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                {club.name}
              </Typography>
            )}
          </Box>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="body2"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  color: '#0A2239',
                  fontWeight: 600,
                }}
              >
                {user.name}
              </Typography>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{
                  ml: 1,
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                  transition: 'transform 0.2s ease-in-out',
                }}
                aria-controls={anchorEl ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={anchorEl ? 'true' : undefined}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    background: 'linear-gradient(135deg, #5BE12C 0%, #2E7D32 100%)',
                    boxShadow: '0 4px 12px rgba(91, 225, 44, 0.4)',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      background: 'rgba(91, 225, 44, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" sx={{ color: '#5D6D7E' }} />
                  </ListItemIcon>
                  <Typography sx={{ fontWeight: 600, color: '#0A2239' }}>Cerrar Sesión</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              zIndex: 1100,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '70px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <PageTransition>{children}</PageTransition>
      </Box>
    </Box>
  );
}; 