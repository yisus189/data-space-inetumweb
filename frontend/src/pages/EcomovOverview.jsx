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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const phase1 = [
  {
    title: '1. Roles básicos',
    points: [
      'Provider: publica datasets y condiciones de uso.',
      'Consumer: accede a datasets bajo contrato.',
      'Operator: gestiona infraestructura y control de acceso.',
      'Autoridad de gobierno: reglas y resolución de conflictos.',
    ],
  },
  {
    title: '2. Onboarding simplificado',
    points: [
      'Solicitud de identidad legal, rol y dominio.',
      'Verificación de representación autorizada.',
      'Aceptación del marco normativo y soberanía del dato.',
      'Emisión de credencial verificable mínima.',
    ],
  },
  {
    title: '3. Acuerdo de participación',
    points: [
      'Reglas base de uso del espacio de datos.',
      'Código de conducta mínimo.',
      'Normas de seguridad obligatorias.',
      'Cláusula de soberanía del dato.',
    ],
  },
  {
    title: '4. Catálogo DCAT-AP',
    points: [
      'Identificador único por dataset.',
      'Título, descripción y palabras clave.',
      'Formato, actualización y cobertura geográfica.',
      'Referencia a política ODRL aplicable.',
    ],
  },
  {
    title: '5. Políticas ODRL básicas',
    points: [
      'Access policy: quién puede ver/acceder.',
      'Contract policy: propósito, duración y redistribución.',
    ],
  },
  {
    title: '6. Contrato de datos',
    points: [
      'Dataset y versión identificados.',
      'Política ODRL aplicable y vigencia.',
      'Responsabilidades de provider y consumer.',
      'Cláusula de supresión al vencimiento.',
    ],
  },
  {
    title: '7. Control de acceso',
    points: [
      'Autenticación por token/API key (MVP).',
      'Autorización basada en política y contrato.',
      'Registro de intentos (éxito/rechazo).',
    ],
  },
  {
    title: '8. Self-description mínima',
    points: [
      'Participante: nombre legal, jurisdicción, rol, contacto.',
      'Dataset: identificador, proveedor, condiciones de uso.',
      'Formato JSON-LD firmado (alineado a Gaia-X).',
    ],
  },
  {
    title: '9. Trazabilidad básica',
    points: [
      'Log de acceso concedido/denegado con timestamp.',
      'Log de transferencia completada (dataset, volumen, hora).',
      'Trazabilidad vinculada al contrato activo.',
    ],
  },
];

const phase2 = [
  'Identity Hub / DAPS para credenciales verificables dinámicas.',
  'Modelo semántico formal (GTFS, DATEX II, NeTEx + JSON Schema).',
  'Auditoría y Clearing House con registro inmutable.',
  'Gestión de incidencias con SLA y escalado de gobernanza.',
  'SLA de disponibilidad y tiempos de respuesta.',
  'Ciclo de vida del dato: alta, activo, versionado, deprecado, borrado.',
];

const phase3 = [
  'Certificación Gaia-X con self-descriptions completas.',
  'Plan de extensión a nuevos participantes con criterios de priorización.',
  'Federación externa IDS/IDSA y federated catalog interoperable.',
];

const dsscIdsaRules = [
  'Soberanía del dato: el proveedor conserva control de uso, propósito y duración.',
  'Interoperabilidad por estándares abiertos: DCAT-AP, ODRL, JSON-LD, IDS/IDSA.',
  'Confianza verificable: identidad, credenciales y evidencia auditable.',
  'Cumplimiento contractual automatizado por políticas de acceso.',
  'No repudio y transparencia operativa mediante logs y auditoría.',
];

function SectionCard({ title, items, color = 'primary.main' }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color }}>
          {title}
        </Typography>
        <List dense sx={{ py: 0 }}>
          {items.map((line) => (
            <ListItem key={line} sx={{ px: 0, py: 0.25 }}>
              <ListItemText primary={`• ${line}`} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

function EcomovOverview() {
  const navigate = useNavigate();

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
        ECOMOV Data Space — Gobernanza e Interoperabilidad
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5, maxWidth: 1100 }}>
        Hoja de ruta completa incorporada para un espacio de datos interoperable: publicación,
        visualización, descarga y consumo por API; gestión multi-provider; contratos y políticas;
        trazabilidad y evolución hacia federación IDS/IDSA y cumplimiento de reglas DSSC.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }}>
        <Chip label="MVP" color="success" />
        <Chip label="Fase 2" color="info" />
        <Chip label="Fase 3" color="default" />
        <Chip label="DCAT-AP" variant="outlined" />
        <Chip label="ODRL" variant="outlined" />
        <Chip label="IDS/IDSA" variant="outlined" />
        <Chip label="DSSC" variant="outlined" />
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                MVP — 9 componentes mínimos antes del primer intercambio
              </Typography>
              <Grid container spacing={1.5}>
                {phase1.map((block) => (
                  <Grid item xs={12} md={6} key={block.title}>
                    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                          {block.title}
                        </Typography>
                        <List dense sx={{ py: 0 }}>
                          {block.points.map((point) => (
                            <ListItem key={point} sx={{ px: 0, py: 0 }}>
                              <ListItemText primary={`• ${point}`} />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Acceso operativo en la plataforma
              </Typography>
              <Stack spacing={1}>
                <Button variant="contained" onClick={() => navigate('/provider/datasets')}>
                  Provider: crear y publicar datasets
                </Button>
                <Button variant="outlined" onClick={() => navigate('/consumer/catalog/local')}>
                  Consumer: ver/descargar datasets
                </Button>
                <Button variant="outlined" onClick={() => navigate('/consumer/access-requests')}>
                  Solicitar acceso API
                </Button>
                <Button variant="outlined" onClick={() => navigate('/provider/contracts')}>
                  Contratos y políticas ODRL
                </Button>
                <Button variant="outlined" onClick={() => navigate('/provider/audit')}>
                  Auditoría y trazabilidad
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <SectionCard title="Reglas DSSC + IDSA incorporadas" items={dsscIdsaRules} color="secondary.main" />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Fase 2 — Madurez operativa (meses 3–6)" items={phase2} color="info.main" />
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Fase 3 — Ecosistema maduro (mes 6+)" items={phase3} color="text.primary" />
        </Grid>
      </Grid>
    </Box>
  );
}

export default EcomovOverview;
