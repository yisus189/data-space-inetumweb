import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function OperatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const panels = [
    {
      title: 'Gestión de usuarios',
      description: 'Administra los usuarios del Data Space y sus roles.',
      buttonText: 'VER USUARIOS',
      path: '/operator/users',
    },
    {
      title: 'Tipos de negociación',
      description: 'Configura y administra los tipos de negociación disponibles.',
      buttonText: 'VER TIPOS DE NEGOCIACIÓN',
      path: '/operator/negotiation-types',
    },
    {
      title: 'Datasets locales',
      description:
        'Revisa en detalle todos los datasets registrados y bloquea los que no cumplan las políticas del Data Space.',
      buttonText: 'REVISAR DATASETS LOCALES',
      path: '/catalog/local', // usa la vista de revisión local del operador
    },
    {
      title: 'Auditoría global',
      description: 'Consulta los registros de actividad y auditoría del sistema.',
      buttonText: 'VER AUDITORÍA',
      path: '/operator/audit',
    },
  ];

  return (
    <Box>
      {/* HERO a todo el ancho */}
      <Box
        sx={{
          width: '100vw',
          height: 220,
          backgroundImage: 'url("/images/operator-hero.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}
      />

      {/* Contenido debajo del hero */}
      <Box sx={{ paddingX: 3, paddingTop: 4, paddingBottom: 6 }}>
        {/* Bienvenida */}
        <Box textAlign="center" marginBottom={4}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 'bold', color: 'primary.main', marginBottom: 1.5 }}
          >
            Bienvenido, {user?.name || user?.email} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Supervisa y configura el Data Space Inetum como operador global.
          </Typography>
        </Box>

        {/* Tarjetas */}
        <Grid container spacing={4} justifyContent="center">
          {panels.map((panel, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', color: 'primary.main', marginBottom: 1 }}
                  >
                    {panel.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {panel.description}
                  </Typography>
                </CardContent>
                <Box sx={{ padding: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => navigate(panel.path)}
                    sx={{ fontWeight: 'bold' }}
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

export default OperatorDashboard;