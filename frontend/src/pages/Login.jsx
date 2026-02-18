// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
} from '@mui/material';

function Login() {
  const [email, setEmail] = useState('provider@example.com');
  const [password, setPassword] = useState('provider123');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);

      const saved = localStorage.getItem('dataspace_user');
      const user = saved ? JSON.parse(saved) : null;

      if (user) {
        if (user.role === 'PROVIDER') navigate('/provider');
        if (user.role === 'CONSUMER') navigate('/consumer');
        if (user.role === 'OPERATOR') navigate('/operator');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Error en login');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at top left, #e3f2fd 0, transparent 55%), radial-gradient(circle at bottom right, #fff3e0 0, transparent 55%)',
        py: 4,
        px: 2,
      }}
    >
      <Container
        maxWidth="sm"
        disableGutters
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            width: '100%',
          }}
        >
          {/* CINTA AZUL SUPERIOR CENTRADA */}
          <Box
            sx={{
              width: '100%',
              background:
                'linear-gradient(135deg, #0d47a1 0%, #1976d2 45%, #42a5f5 100%)',
              color: 'white',
              p: 3,
              textAlign: 'center',
            }}
          >
            <Box sx={{ maxWidth: 360, mx: 'auto' }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', mb: 0.5 }}
              >
                Data Space Inetum
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, mb: 1.5 }}
              >
                Plataforma segura para compartir, descubrir y consumir datos
                entre organizaciones.
              </Typography>

              <Typography
                variant="caption"
                sx={{ opacity: 0.9, fontWeight: 500 }}
              >
              </Typography>
              <Box
                component="ul"
                sx={{
                  listStyle: 'none',
                  pl: 0,
                  m: 0,
                  mt: 0.5,
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  mx: 'auto',
                  maxWidth: 320,
                  '& li': { mb: 0.25 },
                }}
              >
              </Box>
            </Box>
          </Box>

          {/* CUERPO BLANCO CON FORMULARIO CENTRADO */}
          <Box
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 420,
              }}
            >
              <Box mb={2} textAlign="center">
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', mb: 0.5, color: 'primary.main' }}
                >
                  Inicia sesión
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Accede con tus credenciales para continuar.
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  size="small"
                />

                {error && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{ mt: 1, textAlign: 'center' }}
                  >
                    {error}
                  </Typography>
                )}

                {/* Botón principal con hover animado */}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{
                    mt: 3,
                    py: 1,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#0b3c91',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  INICIAR SESIÓN
                </Button>

                <Divider sx={{ my: 2 }}>o</Divider>

                {/* Botón secundario con hover animado */}
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  fullWidth
                  sx={{
                    py: 1,
                    fontWeight: 'bold',
                    borderWidth: 1.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(25,118,210,0.06)',
                      borderColor: '#0d47a1',
                    },
                  }}
                  onClick={() => navigate('/register')}
                >
                  CREAR NUEVA CUENTA
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;