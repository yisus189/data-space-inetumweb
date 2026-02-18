// frontend/src/pages/provider/ProviderContracts.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { listMyContractsAsProvider } from '../../api/contractsApi.js';

function ProviderContracts() {
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
      const data = await listMyContractsAsProvider();
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

  const buildContractSummary = (contract) => {
    const ar = contract.accessRequest;

    const resumen = [
      `Contrato ID: ${contract.id}`,
      `Dataset: ${contract.dataset?.name || contract.datasetId}`,
      `Consumer: ${contract.consumer?.email || contract.consumerId}`,
      contract.consumer?.name
        ? `Nombre consumer: ${contract.consumer.name}`
        : null,
      contract.consumer?.orgUnit
        ? `Unidad organizativa consumer: ${contract.consumer.orgUnit}`
        : null,
      '',
      '--- DATOS DEL CONTRATO ---',
      `Estado: ${contract.status}`,
      `Vigencia desde: ${new Date(contract.effectiveFrom).toLocaleString()}`,
      `Vigencia hasta: ${
        contract.effectiveTo
          ? new Date(contract.effectiveTo).toLocaleString()
          : '-'
      }`,
      '',
      '--- PROPUESTA ORIGINAL DEL CONSUMER ---',
      `Finalidad solicitada: ${ar?.requestedPurpose || '-'}`,
      `Duración solicitada: ${ar?.requestedDuration || '-'}`,
      `Alcance solicitado: ${ar?.requestedScope || '-'}`,
      '',
      '--- CONDICIONES ACORDADAS (definidas por el Provider) ---',
      `Finalidad acordada: ${ar?.agreedPurpose || ar?.requestedPurpose || '-'}`,
      `Duración acordada: ${ar?.agreedDuration || ar?.requestedDuration || '-'}`,
      `Alcance acordado: ${ar?.agreedScope || ar?.requestedScope || '-'}`,
      '',
      '--- TEXTO LEGAL DEL CONTRATO ---',
      contract.contractText || '(Sin texto legal guardado)',
    ]
      .filter(Boolean)
      .join('\n');

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
    <Box>
      {/* Encabezado */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Contratos de datos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Visualiza los contratos de datos vigentes y pasados en los que actúas
          como proveedor. Revisa las condiciones acordadas con cada consumidor.
        </Typography>
      </Box>

      {/* Contenedor principal */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Mis contratos como Provider
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? 'Cargando...'
              : `${contracts.length} contrato${
                  contracts.length === 1 ? '' : 's'
                } encontrado${
                  contracts.length === 1 ? '' : 's'
                }`}
          </Typography>
        </Box>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ maxHeight: 420, overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Dataset</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Consumer (email)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Consumer (nombre)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Consumer (unidad org.)
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vigencia desde</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vigencia hasta</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Finalidad solicitada
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Finalidad acordada
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Duración solicitada
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Duración acordada
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Alcance solicitado
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Alcance acordado
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', textAlign: 'center', width: 130 }}
                >
                  Contrato
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={15}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No tienes contratos como Provider.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {contracts.map((c) => {
                const ar = c.accessRequest || {};
                const requestedPurpose = ar.requestedPurpose || '-';
                const agreedPurpose = ar.agreedPurpose || requestedPurpose || '-';
                const requestedDuration = ar.requestedDuration || '-';
                const agreedDuration = ar.agreedDuration || requestedDuration || '-';
                const requestedScope = ar.requestedScope || '-';
                const agreedScope = ar.agreedScope || requestedScope || '-';

                const { label, color } = getStatusChipProps(c.status);

                return (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.dataset?.name || c.datasetId}</TableCell>
                    <TableCell>{c.consumer?.email || c.consumerId}</TableCell>
                    <TableCell>{c.consumer?.name || '-'}</TableCell>
                    <TableCell>{c.consumer?.orgUnit || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={label}
                        size="small"
                        color={color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(c.effectiveFrom).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {c.effectiveTo
                        ? new Date(c.effectiveTo).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell>{requestedPurpose}</TableCell>
                    <TableCell>{agreedPurpose}</TableCell>
                    <TableCell>{requestedDuration}</TableCell>
                    <TableCell>{agreedDuration}</TableCell>
                    <TableCell>{requestedScope}</TableCell>
                    <TableCell>{agreedScope}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleShowContractText(c)}
                      >
                        Ver contrato
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Diálogo de detalle del contrato */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalle del contrato {selectedContract ? `#${selectedContract.id}` : ''}
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

export default ProviderContracts;