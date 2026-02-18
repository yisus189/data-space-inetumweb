// frontend/src/pages/provider/ProviderAccessRequests.jsx
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
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import {
  listAccessRequestsForProvider,
  rejectAccessRequest,
  providerSendCounterOffer,
  approveAccessRequest,
} from '../../api/contractsApi.js';

function ProviderAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('');
  const [datasetFilter, setDatasetFilter] = useState('');
  const [textFilter, setTextFilter] = useState('');

  // Diálogo de contraoferta
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [counterForm, setCounterForm] = useState({
    providerComment: '',
    agreedPurpose: '',
    agreedDuration: '',
    agreedScope: '',
  });
  const [counterError, setCounterError] = useState('');
  const [counterLoading, setCounterLoading] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listAccessRequestsForProvider();
      setRequests(data);
      setFiltered(data);
    } catch (err) {
      setError(err.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Reaplicar filtros cuando cambian
  useEffect(() => {
    let data = [...requests];

    if (statusFilter) {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (datasetFilter.trim()) {
      data = data.filter((r) =>
        (r.dataset?.name || '')
          .toLowerCase()
          .includes(datasetFilter.trim().toLowerCase())
      );
    }

    if (textFilter.trim()) {
      const term = textFilter.trim().toLowerCase();
      data = data.filter(
        (r) =>
          (r.consumer?.name || '').toLowerCase().includes(term) ||
          (r.consumer?.email || '').toLowerCase().includes(term) ||
          (r.requestedPurpose || '').toLowerCase().includes(term) ||
          (r.consumerComment || '').toLowerCase().includes(term)
      );
    }

    setFiltered(data);
  }, [statusFilter, datasetFilter, textFilter, requests]);

  const handleReject = async (id) => {
    const comment = prompt(
      'Comentario opcional para el consumidor al rechazar:'
    );
    if (comment === null) return; // cancelado
    try {
      await rejectAccessRequest(id, comment || '');
      await loadRequests();
    } catch (err) {
      alert(err.message || 'Error al rechazar solicitud');
    }
  };

  const handleAcceptRequest = async (id) => {
    if (!window.confirm('¿Aceptar la oferta actual y generar el contrato?')) {
        return;
    }
    try {
        await approveAccessRequest(id);
        await loadRequests();
    } catch (err) {
        alert(err.message || 'Error al aceptar la solicitud');
    }
  };

  const handleOpenCounterOffer = (req) => {
    setSelectedRequest(req);
    setCounterError('');

    setCounterForm({
      providerComment: req.providerComment || '',
      agreedPurpose: req.agreedPurpose || req.requestedPurpose || '',
      agreedDuration: req.agreedDuration || req.requestedDuration || '',
      agreedScope: req.agreedScope || req.requestedScope || '',
    });

    setCounterDialogOpen(true);
  };

  const handleCloseCounterDialog = () => {
    setCounterDialogOpen(false);
    setSelectedRequest(null);
    setCounterError('');
    setCounterLoading(false);
  };

  const handleCounterFormChange = (e) => {
    const { name, value } = e.target;
    setCounterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendCounterOffer = async () => {
    if (!selectedRequest) return;
    setCounterError('');
    setCounterLoading(true);

    try {
      await providerSendCounterOffer(selectedRequest.id, {
        providerComment: counterForm.providerComment,
        agreedPurpose: counterForm.agreedPurpose || undefined,
        agreedDuration: counterForm.agreedDuration || undefined,
        agreedScope: counterForm.agreedScope || undefined,
        contractTextOverride: undefined,
      });

      await loadRequests();
      handleCloseCounterDialog();
    } catch (err) {
      setCounterError(err.message || 'Error al enviar contraoferta');
      setCounterLoading(false);
    }
  };

  // Estados distintos para el filtro
  const distinctStatuses = Array.from(
    new Set(requests.map((r) => r.status).filter(Boolean))
  );

  const getStatusChipProps = (status) => {
    switch (status) {
      case 'PENDING':
        return { color: 'warning', label: 'PENDIENTE' };
      case 'APPROVED':
        return { color: 'success', label: 'APROBADA' };
      case 'REJECTED':
        return { color: 'error', label: 'RECHAZADA' };
      case 'COUNTER_FROM_PROVIDER':
        return { color: 'info', label: 'CONTRAOFERTA ENVIADA' };
      case 'COUNTER_FROM_CONSUMER':
        return { color: 'info', label: 'CONTRAOFERTA DEL CONSUMIDOR' };
      default:
        return { color: 'default', label: status || 'DESCONOCIDO' };
    }
  };

    return (
    <Box>
      {/* Encabezado */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Solicitudes de acceso a mis datasets
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Revisa y gestiona las solicitudes de acceso que los consumidores han
          realizado sobre tus datasets. Puedes aceptar ofertas, enviar
          contraofertas o rechazar solicitudes pendientes.
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper
        elevation={3}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              {distinctStatuses.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Dataset"
              value={datasetFilter}
              onChange={(e) => setDatasetFilter(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Buscar (consumer, email, finalidad, comentarios)"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small">
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
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
            Solicitudes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? 'Cargando...'
              : `${filtered.length} solicitud${
                  filtered.length === 1 ? '' : 'es'
                } encontrada${
                  filtered.length === 1 ? '' : 's'
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
                <TableCell sx={{ fontWeight: 'bold' }}>Consumer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Unidad org.</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Finalidad solicitada</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Duración solicitada</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Alcance solicitado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Comentarios</TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', textAlign: 'center', width: 190 }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={11}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No hay solicitudes que coincidan con los filtros
                      seleccionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((r) => {
                const {
                  id,
                  dataset,
                  datasetId,
                  consumer,
                  requestedPurpose,
                  requestedDuration,
                  requestedScope,
                  status,
                  consumerComment,
                } = r;

                const { color, label } = getStatusChipProps(status);

                return (
                  <TableRow key={id} hover>
                    <TableCell>{id}</TableCell>
                    <TableCell>{dataset?.name || datasetId}</TableCell>
                    <TableCell>{consumer?.name || '-'}</TableCell>
                    <TableCell>{consumer?.email || '-'}</TableCell>
                    <TableCell>{consumer?.orgUnit || '-'}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={requestedPurpose}
                      >
                        {requestedPurpose || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{requestedDuration || '-'}</TableCell>
                    <TableCell>{requestedScope || '-'}</TableCell>
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
                          maxWidth: 220,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={consumerComment}
                      >
                        {consumerComment || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {status === 'PENDING' && (
                        <>
                          <Tooltip title="Aceptar oferta y generar contrato" arrow>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircleIcon fontSize="small" />}
                              sx={{ mr: 1, mb: 0.5 }}
                              onClick={() => handleAcceptRequest(id)}
                            >
                              Aceptar
                            </Button>
                          </Tooltip>

                          <Tooltip title="Enviar contraoferta" arrow>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<SwapHorizIcon fontSize="small" />}
                              sx={{ mr: 1, mb: 0.5 }}
                              onClick={() => handleOpenCounterOffer(r)}
                            >
                              Contraoferta
                            </Button>
                          </Tooltip>

                          <Tooltip title="Rechazar solicitud" arrow>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<BlockIcon fontSize="small" />}
                              onClick={() => handleReject(id)}
                            >
                              Rechazar
                            </Button>
                          </Tooltip>
                        </>
                      )}

                      {status === 'COUNTER_FROM_PROVIDER' && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Esperando respuesta del consumidor
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Diálogo de contraoferta */}
      <Dialog
        open={counterDialogOpen}
        onClose={handleCloseCounterDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Enviar contraoferta
          {selectedRequest
            ? ` para la solicitud #${selectedRequest.id}`
            : ''}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Resumen de la solicitud
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dataset: {selectedRequest.dataset?.name || selectedRequest.datasetId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consumer: {selectedRequest.consumer?.name || '-'} (
                {selectedRequest.consumer?.email || '-'})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Unidad org.: {selectedRequest.consumer?.orgUnit || '-'}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                <strong>Finalidad solicitada:</strong>{' '}
                {selectedRequest.requestedPurpose || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Duración solicitada:</strong>{' '}
                {selectedRequest.requestedDuration || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Alcance solicitado:</strong>{' '}
                {selectedRequest.requestedScope || '-'}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Comentario para el consumer"
              name="providerComment"
              value={counterForm.providerComment}
              onChange={handleCounterFormChange}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Finalidad acordada"
              helperText="Si lo dejas vacío se usará la finalidad solicitada por el consumer."
              name="agreedPurpose"
              value={counterForm.agreedPurpose}
              onChange={handleCounterFormChange}
              fullWidth
            />

            <TextField
              label="Duración acordada"
              helperText="Por ejemplo: 6 meses, 1 año. Si lo dejas vacío se usará la duración solicitada."
              name="agreedDuration"
              value={counterForm.agreedDuration}
              onChange={handleCounterFormChange}
              fullWidth
            />

            <TextField
              label="Alcance acordado"
              helperText="Describe qué columnas, nivel de detalle o restricciones aplican. Si lo dejas vacío se usará el alcance solicitado."
              name="agreedScope"
              value={counterForm.agreedScope}
              onChange={handleCounterFormChange}
              fullWidth
              multiline
              minRows={2}
            />

            {counterError && (
              <Typography color="error" variant="body2">
                {counterError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCounterDialog} disabled={counterLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendCounterOffer}
            disabled={counterLoading}
          >
            {counterLoading ? 'Enviando...' : 'Enviar contraoferta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProviderAccessRequests;