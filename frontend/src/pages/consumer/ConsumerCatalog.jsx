// frontend/src/pages/consumer/ConsumerCatalog.jsx
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
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { useNavigate } from 'react-router-dom';

function ConsumerCatalog() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 6,
        px: 3,
        background:
          'radial-gradient(circle at top left, #e3f2fd 0, transparent 55%), radial-gradient(circle at bottom right, #f3e5f5 0, transparent 55%)',
      }}
    >
      {/* Encabezado centrado */}
      <Box textAlign="center" mb={5}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}
        >
          Catálogo de datasets publicados
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 700, mx: 'auto' }}
        >
          Explora los datasets disponibles en el Data Space. Accede a datasets
          publicados localmente por los proveedores o, próximamente, a
          colecciones integradas desde OpenMetadata en la nube.
        </Typography>
      </Box>

      {/* Tarjetas centradas */}
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
        }}
      >
        <Grid
          container
          spacing={4}
          justifyContent="center"
          alignItems="stretch"
        >
          {/* Datasets locales */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={6}
              sx={{
                height: '100%',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                background:
                  'linear-gradient(135deg, #ffffff 0%, #e8f5e9 50%, #c8e6c9 100%)',
              }}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#2e7d32',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <StorageIcon />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 'bold', color: '#1b5e20' }}
                    >
                      Datasets locales
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Datos alojados dentro del Data Space
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Consulta los datasets publicados por los proveedores dentro del
                  Data Space. Explora su descripción, clasificación y términos
                  de uso, y envía solicitudes de acceso para tus casos de uso.
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0, pb: 2.5 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/consumer/catalog/local')}
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#2e7d32',
                    '&:hover': { backgroundColor: '#1b5e20' },
                  }}
                >
                  VER DATASETS LOCALES
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* OpenMetadata (nube) */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={6}
              sx={{
                height: '100%',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                background:
                  'linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #bbdefb 100%)',
              }}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#1565c0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <CloudQueueIcon />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 'bold', color: '#0d47a1' }}
                    >
                      OpenMetadata
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Datasets desde la nube y fuentes externas
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Bienvenido a los datasets de OpenMetadata.
                  Podrás descubrir aquí colecciones de datos catalogadas desde
                  la nube y otras fuentes externas conectadas al Data Space,
                  con capacidades avanzadas de exploración.
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0, pb: 2.5 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/consumer/catalog/open-metadata')}
                  sx={{
                    fontWeight: 'bold',
                    borderColor: '#1565c0',
                    color: '#0d47a1',
                    '&:hover': {
                      borderColor: '#0d47a1',
                      backgroundColor: 'rgba(13, 71, 161, 0.06)',
                    },
                  }}
                >
                  ENTRAR A OPENMETADATA
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default ConsumerCatalog;