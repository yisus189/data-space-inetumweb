import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
} from '@mui/material';
import { registerUser } from '../api/authApi.js';
import { useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    country: '',
    city: '',
    phone: '',
    email: '',
    password: '',
    role: 'CONSUMER',
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      await registerUser(form);
      setInfo(
        'Registro enviado correctamente. Un operador revisará tu cuenta y te avisaremos cuando esté aprobada.'
      );
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.message || 'Error en el registro');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: 8 }}>
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{ fontWeight: 'bold', color: 'primary.main' }}
        >
          Crear cuenta
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" mb={2}>
          Regístrate como consumidor o proveedor de datos.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nombre completo"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="País"
                name="country"
                value={form.country}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ciudad"
                name="city"
                value={form.city}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Teléfono"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Correo electrónico"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contraseña"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Rol solicitado"
                name="role"
                value={form.role}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="CONSUMER">Consumer (consumidor de datos)</MenuItem>
                <MenuItem value="PROVIDER">Provider (proveedor de datasets)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          {info && (
            <Typography color="success.main" sx={{ mt: 2 }}>
              {info}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, fontWeight: 'bold' }}
          >
            Registrarse
          </Button>

          <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/')}>
            ¿Ya tienes cuenta? Inicia sesión
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Register;