import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const mvpItems = [
  'Roles básicos (Provider / Consumer / Operator / Gobernanza)',
  'Onboarding simplificado de participantes',
  'Acuerdo de participación con reglas mínimas',
  'Catálogo DCAT-AP con metadatos básicos',
  'Políticas ODRL de acceso y contrato',
  'Contrato de datos entre proveedor y consumidor',
  'Control de acceso con token / API key',
  'Self-description mínima del participante y dataset',
  'Trazabilidad de accesos y transferencias',
];

function EcomovOverview() {
  const navigate = useNavigate();

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, maxWidth: 1300, mx: 'auto' }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
        ECOMOV Data Space
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 980 }}>
        Espacio de datos interoperable para publicar, descubrir, solicitar acceso, contratar,
        consumir y auditar datasets de movilidad. Esta pantalla resume el estado funcional
        del MVP y organiza el acceso a cada módulo operativo.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip label="MVP" color="success" />
                <Chip label="Fase 1" color="primary" variant="outlined" />
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Componentes mínimos implementables
              </Typography>
              <Stack spacing={1}>
                {mvpItems.map((item) => (
                  <Typography key={item} variant="body2">• {item}</Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Acciones rápidas
              </Typography>
              <Stack spacing={1.2}>
                <Button variant="contained" onClick={() => navigate('/provider/datasets')}>
                  Provider: crear datasets
                </Button>
                <Button variant="outlined" onClick={() => navigate('/consumer/catalog/local')}>
                  Consumer: ver y descargar datasets
                </Button>
                <Button variant="outlined" onClick={() => navigate('/consumer/access-requests')}>
                  Consumer: solicitar acceso API
                </Button>
                <Button variant="outlined" onClick={() => navigate('/provider/contracts')}>
                  Gestionar contratos ODRL
                </Button>
                <Button variant="outlined" onClick={() => navigate('/provider/audit')}>
                  Ver trazabilidad y auditoría
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Estructura lógica recomendada para ECOMOV
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>1) Gobierno y confianza</Typography>
              <Typography variant="body2" color="text.secondary">
                Roles, onboarding, acuerdos de participación, políticas y gestión de incidencias.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2) Intercambio operativo</Typography>
              <Typography variant="body2" color="text.secondary">
                Catálogo DCAT-AP, contratos, control de acceso por API y consumo por parte del consumer.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>3) Evidencia y mejora</Typography>
              <Typography variant="body2" color="text.secondary">
                Logs obligatorios, auditoría global, SLA y ciclo de vida del dataset por versión.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EcomovOverview;
