// frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Avatar,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import GavelIcon from '@mui/icons-material/Gavel';
import AssessmentIcon from '@mui/icons-material/Assessment';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavigate = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const initials =
    (user?.name && user.name.trim()[0]) ||
    (user?.email && user.email.trim()[0]) ||
    '?';

  const isActive = (path) => location.pathname.startsWith(path);

  // Menús por rol

  const consumerMenu = [
    {
      label: 'Inicio',
      path: '/consumer',
      icon: <DashboardIcon fontSize="small" />,
    },
    {
      label: 'Catálogo de datasets',
      path: '/consumer/catalog',
      icon: <FolderOpenIcon fontSize="small" />,
    },
    {
      label: 'Mis solicitudes de acceso',
      path: '/consumer/access-requests',
      icon: <PendingActionsIcon fontSize="small" />,
    },
    {
      label: 'Mis contratos',
      path: '/consumer/contracts',
      icon: <GavelIcon fontSize="small" />,
    },
    // Soporte del CONSUMER → /support/my
    {
      label: 'Soporte',
      path: '/support/my',
      icon: <AssessmentIcon fontSize="small" />,
    },
  ];

  const providerMenu = [
    {
      label: 'Inicio',
      path: '/provider',
      icon: <DashboardIcon fontSize="small" />,
    },
    {
      label: 'Mis datasets',
      path: '/provider/datasets',
      icon: <StorageIcon fontSize="small" />,
    },
    {
      label: 'Solicitudes de acceso',
      path: '/provider/access-requests',
      icon: <PendingActionsIcon fontSize="small" />,
    },
    {
      label: 'Contratos',
      path: '/provider/contracts',
      icon: <GavelIcon fontSize="small" />,
    },
    {
      label: 'Auditoría',
      path: '/provider/audit',
      icon: <AssessmentIcon fontSize="small" />,
    },
    // Soporte del PROVIDER → /support/my
    {
      label: 'Soporte',
      path: '/support/my',
      icon: <AssessmentIcon fontSize="small" />,
    },
  ];

  const operatorMenu = [
    {
      label: 'Inicio',
      path: '/operator',
      icon: <DashboardIcon fontSize="small" />,
    },
    {
      label: 'Gestión de datasets',
      path: '/catalog/local', // o '/operator/datasets' si prefieres
      icon: <StorageIcon fontSize="small" />,
    },
    {
      label: 'Usuarios y roles',
      path: '/operator/users',
      icon: <PeopleIcon fontSize="small" />,
    },
    {
      label: 'Contratos',
      path: '/operator/contracts',
      icon: <GavelIcon fontSize="small" />,
    },
    {
      label: 'Auditoría global',
      path: '/operator/audit',
      icon: <AssessmentIcon fontSize="small" />,
    },
    // Soporte del OPERATOR → panel global /support/operator
    {
      label: 'Soporte',
      path: '/support/operator',
      icon: <AssessmentIcon fontSize="small" />,
    },
  ];

  let menuItems = [];
  let rolLabel = '';

  if (user?.role === 'CONSUMER') {
    menuItems = consumerMenu;
    rolLabel = 'Consumer';
  } else if (user?.role === 'PROVIDER') {
    menuItems = providerMenu;
    rolLabel = 'Provider';
  } else if (user?.role === 'OPERATOR') {
    menuItems = operatorMenu;
    rolLabel = 'Operator';
  }

  return (
    <>
      <AppBar
        position="fixed"
        elevation={4}
        sx={{
          background:
            'linear-gradient(90deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)',
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              flexGrow: 1,
              gap: 1,
            }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 0.5,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 'bold', color: 'white' }}
              >
                DS
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', lineHeight: 1, color: 'white' }}
              >
                Data Space Inetum
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.8)' }}
              >
                Plataforma de intercambio de datos
              </Typography>
            </Box>
          </Box>

          {user && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box textAlign="right">
                <Typography
                  variant="body2"
                  sx={{ color: 'primary.contrastText', fontWeight: 500 }}
                >
                  {user.name || user.email}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  {rolLabel || user.role}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                }}
              >
                {initials.toUpperCase()}
              </Avatar>
              <IconButton
                color="inherit"
                size="small"
                onClick={handleLogout}
                sx={{
                  ml: 1,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: 280 },
        }}
      >
        <Box
          sx={{
            p: 2,
            pb: 1.5,
            background:
              'linear-gradient(135deg, #0d47a1 0%, #1976d2 60%, #42a5f5 100%)',
            color: 'white',
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            Data Space Inetum
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Menú {rolLabel || 'principal'}
          </Typography>
        </Box>

        <Box sx={{ p: 1 }}>
          {menuItems.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  display: 'block',
                  color: 'text.secondary',
                }}
              >
                Navegación
              </Typography>
              <List>
                {menuItems.map((item) => (
                  <ListItem disablePadding key={item.path}>
                    <ListItemButton
                      onClick={() => handleNavigate(item.path)}
                      selected={isActive(item.path)}
                      sx={{
                        borderRadius: 1.5,
                        mx: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(25,118,210,0.08)',
                          '&:hover': {
                            backgroundColor: 'rgba(25,118,210,0.12)',
                          },
                        },
                      }}
                    >
                      {item.icon && (
                        <Box sx={{ mr: 1.5, color: 'primary.main' }}>
                          {item.icon}
                        </Box>
                      )}
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}

          <Divider sx={{ my: 1.5 }} />

          {user && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}

export default Navbar;