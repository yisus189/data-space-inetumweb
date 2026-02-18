// frontend/src/pages/consumer/ConsumerAccessRequests.jsx
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
import {
  listMyAccessRequestsAsConsumer,
  consumerAcceptCounterOffer,
} from '../../api/contractsApi.js';

function ConsumerAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listMyAccessRequestsAsConsumer();
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

    const openAcceptDialog = (id) => {
    setSelectedRequestId(id);
    setAcceptError('');
    setAcceptDialogOpen(true);
  };

  const handleAcceptCounterOffer = async () => {
    if (!selectedRequestId) return;
    setAcceptError('');
    setAcceptLoading(true);

    try {
      await consumerAcceptCounterOffer(selectedRequestId);
      await loadRequests();
      setAcceptDialogOpen(false);
      setSelectedRequestId(null);
    } catch (err) {
      setAcceptError(err.message || 'Error al aceptar contraoferta');
    } finally {
      setAcceptLoading(false);
    }
  };

  const getStatusChipProps = (status) => {
    switch (status) {
      case 'PENDING':
        return { label: 'PENDIENTE', color: 'warning' };
      case 'APPROVED':
        return { label: 'APROBADA', color: 'success' };
      case 'REJECTED':
        return { label: 'RECHAZADA', color: 'error' };
      case 'COUNTER_FROM_PROVIDER':
        return { label: 'CONTRAOFERTA DEL PROVIDER', color: 'info' };
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
          'radial-gradient(circle at top left, #e3f2fd 0, transparent 55%), radial-gradient(circle at bottom right, #fff3e0 0, transparent 55%)',
      }}
    >
      {/* Encabezado */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Mis solicitudes de acceso
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Revisa el estado de tus solicitudes de acceso a datasets. Aquí podrás
          ver si el proveedor ha respondido, si existe una contraoferta o si ya
          se ha generado el contrato correspondiente.
        </Typography>
      </Box>

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
            Mis solicitudes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? 'Cargando...'
              : `${requests.length} solicitud${
                  requests.length === 1 ? '' : 'es'
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
                <TableCell sx={{ fontWeight: 'bold' }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
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
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Comentarios del provider
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', textAlign: 'center', width: 170 }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={12}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No tienes solicitudes de acceso registradas.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {requests.map((r) => {
                const requestedPurpose = r.requestedPurpose || '-';
                const agreedPurpose = r.agreedPurpose || requestedPurpose || '-';
                const requestedDuration = r.requestedDuration || '-';
                const agreedDuration = r.agreedDuration || requestedDuration || '-';
                const requestedScope = r.requestedScope || '-';
                const agreedScope = r.agreedScope || requestedScope || '-';

                const { label, color } = getStatusChipProps(r.status);

                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.dataset?.name || r.datasetId}</TableCell>
                    <TableCell>
                      {r.dataset?.provider?.email ||
                        r.dataset?.provider?.name ||
                        '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={label}
                        size="small"
                        color={color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 180,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={requestedPurpose}
                      >
                        {requestedPurpose}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 180,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={agreedPurpose}
                      >
                        {agreedPurpose}
                      </Typography>
                    </TableCell>
                    <TableCell>{requestedDuration}</TableCell>
                    <TableCell>{agreedDuration}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 180,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={requestedScope}
                      >
                        {requestedScope}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 180,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={agreedScope}
                      >
                        {agreedScope}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={r.providerComment}
                      >
                        {r.providerComment || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {r.status === 'COUNTER_FROM_PROVIDER' && (
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => openAcceptDialog(r.id)}
                        >
                            Aceptar propuesta
                        </Button>
                      )}
                      {r.status === 'PENDING' && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Esperando respuesta del provider
                        </Typography>
                      )}
                      {r.status === 'APPROVED' && (
                        <Typography
                          variant="caption"
                          color="success.main"
                        >
                          Contrato generado
                        </Typography>
                      )}
                      {r.status === 'REJECTED' && (
                        <Typography
                          variant="caption"
                          color="error"
                        >
                          Rechazada
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
              <Dialog
        open={acceptDialogOpen}
        onClose={() => {
          if (acceptLoading) return;
          setAcceptDialogOpen(false);
          setSelectedRequestId(null);
          setAcceptError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Aceptar propuesta del provider</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1 }}>
            ¿Aceptas la propuesta del provider y deseas generar el contrato
            correspondiente para esta solicitud de acceso?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Una vez aceptada, la solicitud pasará a estado <strong>APROBADA</strong>{' '}
            y el contrato aparecerá en la sección <strong>"Mis contratos"</strong>.
          </Typography>

          {acceptError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {acceptError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (acceptLoading) return;
              setAcceptDialogOpen(false);
              setSelectedRequestId(null);
              setAcceptError('');
            }}
            disabled={acceptLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAcceptCounterOffer}
            disabled={acceptLoading}
          >
            {acceptLoading ? 'Confirmando...' : 'Aceptar y generar contrato'}
          </Button>
        </DialogActions>
      </Dialog>
      </Paper>
    </Box>
  );
}

export default ConsumerAccessRequests;