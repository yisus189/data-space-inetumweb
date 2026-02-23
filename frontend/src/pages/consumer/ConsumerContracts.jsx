// frontend/src/pages/consumer/ConsumerContracts.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { listMyContractsAsConsumer } from '../../api/contractsApi.js';

const API_URL = 'http://localhost:4001';

function ConsumerContracts() {
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedContract, setSelectedContract] = useState(null);
  const [contractSummary, setContractSummary] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listMyContractsAsConsumer();
      setContracts(data);
    } catch (err) {
      setError(err.message || 'Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleAccessData = async (contract) => {
    const datasetId = contract.datasetId;
    const storageType = contract.dataset?.storageType || 'FILE';

    const token = localStorage.getItem('dataspace_token');
    if (!token) {
      alert('No estás autenticado.');
      return;
    }

    const purpose =
      contract.accessRequest?.agreedPurpose ||
      contract.accessRequest?.requestedPurpose ||
      '';

    const query = new URLSearchParams();
    if (purpose) {
      query.set('purpose', purpose);
    }

    try {
      if (storageType === 'FILE') {
        const response = await fetch(
          `${API_URL}/exchange/datasets/${datasetId}/download?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Error al descargar dataset');
        }

        const blob = await response.blob();
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `${contract.dataset?.name || 'dataset'}.dat`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(fileUrl);
        return;
      }

      if (storageType === 'EXTERNAL_API') {
        const response = await fetch(
          `${API_URL}/exchange/datasets/${datasetId}/download?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al acceder a datos externos');
        }

        if (data.mode === 'EXTERNAL_API' && data.externalUrl) {
          if (
            window.confirm(
              `Este dataset se sirve desde una URL externa:

${data.externalUrl}

¿Quieres abrirla en una nueva pestaña?`
            )
          ) {
            window.open(data.externalUrl, '_blank', 'noopener,noreferrer');
          }
        } else {
          alert('Respuesta inesperada del servidor para EXTERNAL_API.');
        }

        return;
      }

      alert(`Este tipo de almacenamiento no está soportado aún: ${storageType}`);
    } catch (err) {
      alert(err.message || 'Error al acceder a datos');
    }
  };

  const buildContractSummary = (contract) => {
    const ar = contract.accessRequest || {};
    const resumen = [
      `Contrato ID: ${contract.id}`,
      `Dataset: ${contract.dataset?.name || contract.datasetId}`,
      `Provider: ${contract.provider?.email || contract.providerId}`,
      '',
      '--- DATOS DEL CONTRATO ---',
      `Estado: ${contract.status}`,
      `Vigencia desde: ${new Date(contract.effectiveFrom).toLocaleString()}`,
      `Vigencia hasta: ${
        contract.effectiveTo
          ? new Date(contract.effectiveTo).toLocaleString()
          : 'Indefinida'
      }`,
      '',
      '--- CONDICIONES DE USO ---',
      `Finalidad acordada: ${ar.agreedPurpose || ar.requestedPurpose || '-'}`,
      `Duración acordada: ${
        ar.agreedDuration || ar.requestedDuration || '-'
      }`,
      `Alcance acordado: ${ar.agreedScope || ar.requestedScope || '-'}`,
      '',
      '--- TEXTO LEGAL DEL CONTRATO ---',
      contract.contractText || '(Sin texto legal guardado)',
    ].join('\n');

    return resumen;
  };

  const handleShowContractText = (contract) => {
    setSelectedContract(contract);
    setContractSummary(buildContractSummary(contract));
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedContract(null);
    setContractSummary('');
  };

  const getStatusChipProps = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'ACTIVO', color: 'success' };
      case 'EXPIRED':
        return { label: 'EXPIRADO', color: 'default' };
      case 'REVOKED':
        return { label: 'REVOCADO', color: 'error' };
      case 'PENDING':
        return { label: 'PENDIENTE', color: 'warning' };
      default:
        return { label: status || 'DESCONOCIDO', color: 'default' };
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        px: 3,
        background:
          'radial-gradient(circle at top left, #e3f2fd 0, transparent 55%), radial-gradient(circle at bottom right, #f1f8e9 0, transparent 55%)',
      }}
    >
      <Box mb={3} textAlign="center">
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: 'primary.main' }}
        >
          Mis contratos de datos
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 700, mx: 'auto' }}
        >
          Consulta los contratos activos y pasados asociados a tus solicitudes de
          acceso. Desde aquí puedes revisar las condiciones acordadas y acceder
          a los datos cuando el contrato está activo.
        </Typography>
      </Box>

      {error && (
        <Typography variant="body2" color="error" align="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2, textAlign: 'right' }}
      >
        {loading
          ? 'Cargando...'
          : `${contracts.length} contrato${
              contracts.length === 1 ? '' : 's'
            } encontrado${
              contracts.length === 1 ? '' : 's'
            }`}
      </Typography>

      <Grid container spacing={3}>
        {contracts.map((contract) => {
          const ar = contract.accessRequest || {};
          const { label, color } = getStatusChipProps(contract.status);

          return (
            <Grid item xs={12} sm={6} md={4} key={contract.id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}
                  >
                    {contract.dataset?.name || 'Nombre desconocido'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Provider:{' '}
                    {contract.provider?.email ||
                      contract.provider?.name ||
                      contract.providerId}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={label} color={color} size="small" />
                    <Chip
                      label={`ID ${contract.id}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Finalidad acordada:</strong>{' '}
                    {ar.agreedPurpose || ar.requestedPurpose || 'No especificada'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Duración:</strong>{' '}
                    {ar.agreedDuration || ar.requestedDuration || 'No especificada'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Vigencia desde:</strong>{' '}
                    {new Date(contract.effectiveFrom).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Vigencia hasta:</strong>{' '}
                    {contract.effectiveTo
                      ? new Date(contract.effectiveTo).toLocaleString()
                      : 'Indefinida'}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0, pb: 2.5 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    sx={{ mb: 1 }}
                    startIcon={<DescriptionIcon />}
                    onClick={() => handleShowContractText(contract)}
                  >
                    Ver contrato
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    startIcon={<CloudDownloadIcon />}
                    disabled={contract.status !== 'ACTIVE'}
                    onClick={() => handleAccessData(contract)}
                  >
                    Acceder a datos
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}

        {contracts.length === 0 && !loading && (
          <Grid item xs={12}>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 4 }}
            >
              No tienes contratos como consumidor todavía.
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Diálogo detalle del contrato */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalle del contrato{' '}
          {selectedContract ? `#${selectedContract.id}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Typography
            component="pre"
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
            }}
          >
            {contractSummary}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ConsumerContracts;