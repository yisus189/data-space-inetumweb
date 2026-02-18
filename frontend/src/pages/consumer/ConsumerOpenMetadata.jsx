// frontend/src/pages/consumer/ConsumerOpenMetadata.jsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

function ConsumerOpenMetadata() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
        Datasets OpenMetadata
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          textAlign: 'center',
          background:
            'linear-gradient(135deg, #ffffff 0%, #f5f7fb 40%, #e3f2fd 100%)',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1.5 }}>
          Bienvenido a los datasets de OpenMetadata
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Podrás explorar aquí datasets catalogados desde
          OpenMetadata y otras fuentes externas conectadas al Data Space.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ademas utiliza el catálogo de <strong>datasets locales</strong>{' '}
          para encontrar y solicitar acceso a los datos que necesites.
        </Typography>
      </Paper>
    </Box>
  );
}

export default ConsumerOpenMetadata;