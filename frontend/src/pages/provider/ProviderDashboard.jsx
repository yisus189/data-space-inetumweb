// frontend/src/pages/provider/ProviderDashboard.jsx
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GavelIcon from '@mui/icons-material/Gavel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const panels = [
    {
      title: 'Mis datasets',
      description:
        'Crea, organiza y publica tus datasets para que los consumidores puedan descubrirlos.',
      buttonText: 'GESTIONAR DATASETS',
      path: '/provider/datasets',
      icon: <StorageIcon />,
      color: '#1565c0',
      bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    },
    {
      title: 'Solicitudes de acceso',
      description:
        'Revisa y responde las solicitudes de acceso a tus datasets, incluyendo contraofertas.',
      buttonText: 'VER SOLICITUDES',
      path: '/provider/access-requests',
      icon: <AssignmentTurnedInIcon />,
      color: '#ef6c00',
      bg: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    },
    {
      title: 'Mis contratos',
      description:
        'Consulta los contratos de datos establecidos con los consumidores y sus condiciones.',
      buttonText: 'VER CONTRATOS',
      path: '/provider/contracts',
      icon: <GavelIcon />,
      color: '#2e7d32',
      bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    },
    {
      title: 'Auditoría de accesos',
      description:
        'Supervisa el historial de accesos y uso de tus datasets por parte de los consumidores.',
      buttonText: 'VER AUDITORÍA',
      path: '/provider/audit',
      icon: <VisibilityIcon />,
      color: '#6a1b9a',
      bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
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
          'radial-gradient(circle at top left, #e3f2fd 0, transparent 55%), radial-gradient(circle at bottom right, #f3e5f5 0, transparent 55%)',
      }}
    >
      {/* HERO a todo el ancho */}
      <Box
        sx={{
          width: '100vw',
          height: 230,
          backgroundImage: 'url("/images/panel-provider.jpeg")',
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
              'linear-gradient(90deg, rgba(46,125,50,0.75) 0%, rgba(56,142,60,0.4) 50%, rgba(27,94,32,0.75) 100%)',
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
            Tu panel como proveedor de datos
          </Typography>
          <Typography variant="body1">
            Publica datasets, gestiona solicitudes y controla el acceso a la
            información dentro del Data Space.
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
            Desde aquí puedes administrar tus activos de datos, responder
            solicitudes y supervisar el uso que se hace de tus datasets.
          </Typography>
        </Box>

        {/* Tarjetas con acciones */}
        <Grid container spacing={4} justifyContent="center">
          {panels.map((panel, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
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
                      sx={{ fontWeight: 'bold', color: '#1b1b1b' }}
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
                    {panel.buttonText.toUpperCase()}
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

export default ProviderDashboard;