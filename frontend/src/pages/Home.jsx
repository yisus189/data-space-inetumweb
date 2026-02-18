import React from 'react';
import { Box, Typography, Button } from '@mui/material';

function Home() {
  return (
    <Box
      sx={{
        backgroundImage: 'url(/background-image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="h3"
        align="center"
        sx={{ fontWeight: 'bold', color: '#ffffff' }}
      >
        ¡Bienvenido a Data Space Inetum!
      </Typography>
      <Button variant="contained" color="primary" size="large">
        Explorar Catálogo
      </Button>
    </Box>
  );
}

export default Home;