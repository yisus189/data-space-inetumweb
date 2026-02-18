import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';

function CatalogSelector() {
  const navigate = useNavigate();

  return (
    <Box sx={{ paddingY: 3 }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}
      >
        Catálogo de Datasets
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Selecciona el tipo de catálogo que quieres explorar.
      </Typography>

      <Grid container spacing={3}>
        {/* Caja 1: Catálogo local */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <StorageIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Datasets locales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Datasets registrados dentro del propio Data Space.
                </Typography>
              </Box>
            </Box>

            <Box flexGrow={1} />

            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/catalog/local')}
            >
              Ver catálogo local
            </Button>
          </Paper>
        </Grid>

        {/* Caja 2: OpenMetadata */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <CloudIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Datasets de OpenMetadata
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Explora los datasets publicados en tu instancia de OpenMetadata.
                </Typography>
              </Box>
            </Box>

            <Box flexGrow={1} />

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/catalog/openmetadata')}
            >
              Ver datasets de OpenMetadata
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CatalogSelector;