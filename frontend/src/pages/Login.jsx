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

      if (user?.role === 'PROVIDER') navigate('/provider');
      else if (user?.role === 'CONSUMER') navigate('/consumer');
      else if (user?.role === 'OPERATOR') navigate('/operator');
      else navigate('/');
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
        px: 2,
        py: 4,
        background:
          'radial-gradient(circle at 15% 15%, rgba(79,124,255,0.18), transparent 32%), radial-gradient(circle at 85% 80%, rgba(138,107,255,0.16), transparent 36%), #070b14',
      }}
    >
      <Container maxWidth="sm" disableGutters>
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: 3,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Box
            sx={{
              p: 3,
              borderBottom: '1px solid',
              borderColor: 'divider',
              background:
                'linear-gradient(120deg, rgba(79,124,255,0.2) 0%, rgba(138,107,255,0.15) 100%)',
            }}
          >
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
              Data Space Inetum
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plataforma segura para compartir, descubrir y consumir datos.
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Box mb={2.5}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
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
              />
              <TextField
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
              />

              {error && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ mt: 1.5, textAlign: 'center' }}
                >
                  {error}
                </Typography>
              )}

              <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, py: 1 }}>
                Iniciar sesión
              </Button>

              <Divider sx={{ my: 2, color: 'text.secondary' }}>o</Divider>

              <Button
                type="button"
                variant="outlined"
                color="primary"
                fullWidth
                sx={{ py: 1 }}
                onClick={() => navigate('/register')}
              >
                Crear nueva cuenta
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
