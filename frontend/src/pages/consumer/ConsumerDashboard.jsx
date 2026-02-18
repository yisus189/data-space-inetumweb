// frontend/src/pages/consumer/ConsumerDashboard.jsx
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import GavelIcon from '@mui/icons-material/Gavel';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function ConsumerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const panels = [
    {
      title: 'Catálogo de datasets',
      description:
        'Explora datasets publicados por los proveedores y envía solicitudes de acceso.',
      buttonText: 'ACCEDER AL CATÁLOGO',
      path: '/consumer/catalog',
      icon: <FolderOpenIcon />,
      color: '#1565c0',
      bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    },
    {
      title: 'Mis contratos activos',
      description:
        'Revisa los contratos vigentes y accede a los datos según las condiciones acordadas.',
      buttonText: 'VER CONTRATOS',
      path: '/consumer/contracts',
      icon: <GavelIcon />,
      color: '#2e7d32',
      bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    },
    {
      title: 'Mis solicitudes de acceso',
      description:
        'Consulta el estado de tus solicitudes, contraofertas del provider y resoluciones.',
      buttonText: 'VER SOLICITUDES',
      path: '/consumer/access-requests',
      icon: <PendingActionsIcon />,
      color: '#ef6c00',
      bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #e3f2fd 0, transparent 55%), radial-gradient(circle at bottom right, #fff3e0 0, transparent 55%)',
      }}
    >
      {/* HERO a todo el ancho */}
      <Box
        sx={{
          width: '100vw',
          height: 230,
          backgroundImage: 'url("/images/consumer-hero.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(13,71,161,0.7) 0%, rgba(25,118,210,0.4) 50%, rgba(21,101,192,0.7) 100%)',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            textAlign: 'center',
            color: 'white',
            px: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            Tu espacio como consumidor de datos
          </Typography>
          <Typography variant="body1">
            Descubre, solicita y utiliza datasets del Data Space de forma
            segura y controlada.
          </Typography>
        </Box>
      </Box>

      {/* Contenido debajo del hero */}
      <Box sx={{ px: 3, pt: 4, pb: 6 }}>
        {/* Bienvenida */}
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}
          >
            Bienvenido, {user?.name || user?.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Desde aquí puedes acceder al catálogo, seguir tus solicitudes y
            gestionar los contratos de acceso a datos.
          </Typography>
        </Box>

        {/* Tarjetas */}
        <Grid container spacing={4} justifyContent="center">
          {panels.map((panel, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  background: panel.bg,
                }}
              >
                <CardContent sx={{ pb: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1.5,
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: panel.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      {panel.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', color: '#1a237e' }}
                    >
                      {panel.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {panel.description}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0, pb: 2.5 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleNavigate(panel.path)}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: panel.color,
                      '&:hover': { backgroundColor: panel.color },
                    }}
                  >
                    {panel.buttonText}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

export default ConsumerDashboard;