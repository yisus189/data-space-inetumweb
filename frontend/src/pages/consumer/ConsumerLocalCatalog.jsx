// frontend/src/pages/consumer/ConsumerLocalCatalog.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
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
import SearchIcon from '@mui/icons-material/Search';
import { getPublishedDatasets } from '../../api/catalogApi.js';
import { createAccessRequest } from '../../api/contractsApi.js';

function ConsumerLocalCatalog() {
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // estado para el formulario de solicitud
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestDataset, setRequestDataset] = useState(null);
  const [requestForm, setRequestForm] = useState({
    requestedPurpose: '',
    requestedDuration: '',
    requestedScope: '',
    consumerComment: '',
  });
  const [requestError, setRequestError] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError('');
      const params = search ? { search } : {};
      const data = await getPublishedDatasets(params);
      setDatasets(data);
    } catch (err) {
      setError(err.message || 'Error al cargar catálogo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // carga inicial

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadDatasets();
  };

  // abrir diálogo
  const handleOpenRequestDialog = (dataset) => {
    setRequestDataset(dataset);
    setRequestForm({
      requestedPurpose: '',
      requestedDuration: '',
      requestedScope: '',
      consumerComment: '',
    });
    setRequestError('');
    setRequestSubmitting(false);
    setRequestDialogOpen(true);
  };

  const handleCloseRequestDialog = () => {
    if (requestSubmitting) return;
    setRequestDialogOpen(false);
    setRequestDataset(null);
  };

  const handleRequestFormChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async () => {
    setRequestError('');

    if (!requestForm.requestedPurpose.trim()) {
      setRequestError('La finalidad de uso es obligatoria.');
      return;
    }

    try {
      setRequestSubmitting(true);
      await createAccessRequest({
        datasetId: requestDataset.id,
        requestedPurpose: requestForm.requestedPurpose.trim(),
        requestedDuration: requestForm.requestedDuration.trim() || undefined,
        requestedScope: requestForm.requestedScope.trim() || undefined,
        consumerComment: requestForm.consumerComment.trim() || undefined,
        // negotiationTypeId: opcional
      });
      setRequestDialogOpen(false);
      setRequestDataset(null);
      alert('Solicitud de acceso creada correctamente.');
    } catch (err) {
      setRequestError(err.message || 'Error al crear solicitud de acceso.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Encabezado */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Datasets locales publicados
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Estos son los datasets publicados por los proveedores dentro del Data
          Space y disponibles para solicitar acceso. Usa el buscador para
          filtrar por nombre, descripción o tags.
        </Typography>
      </Box>

      {/* Buscador */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
        component="form"
        onSubmit={handleSearch}
      >
        <TextField
          label="Buscar por nombre, descripción o tags"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" size="small">
                  <SearchIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>
          {loading
            ? 'Cargando...'
            : `${datasets.length} dataset${
                datasets.length === 1 ? '' : 's'
              } encontrado${
                datasets.length === 1 ? '' : 's'
              }`}
        </Typography>
      </Paper>

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Tabla de datasets */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ maxHeight: 420, overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Clasificación</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Base legal</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Origen</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Términos de uso</TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', textAlign: 'center', width: 150 }}
                >
                  Acceso
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datasets.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No hay datasets publicados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {datasets.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 260,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={d.description}
                    >
                      {d.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {d.provider?.name || d.provider?.email || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={d.dataClassification || '-'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{d.legalBasis || '-'}</TableCell>
                  <TableCell>{d.origin || '-'}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 260,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={d.usageTerms}
                    >
                      {d.usageTerms || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenRequestDialog(d)}
                    >
                      Solicitar acceso
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Diálogo de solicitud de acceso */}
      <Dialog
        open={requestDialogOpen}
        onClose={handleCloseRequestDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Solicitar acceso
          {requestDataset ? ` a "${requestDataset.name}"` : ''}
        </DialogTitle>
        <DialogContent dividers>
          {requestDataset && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Provider:{' '}
                {requestDataset.provider?.name ||
                  requestDataset.provider?.email ||
                  '-'}
              </Typography>
              {requestDataset.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Descripción: {requestDataset.description}
                </Typography>
              )}
            </Box>
          )}

          <TextField
            label="Finalidad de uso de los datos *"
            name="requestedPurpose"
            value={requestForm.requestedPurpose}
            onChange={handleRequestFormChange}
            fullWidth
            margin="normal"
            multiline
            minRows={2}
          />
          <TextField
            label='Duración solicitada (por ejemplo: "6 meses", "1 año")'
            name="requestedDuration"
            value={requestForm.requestedDuration}
            onChange={handleRequestFormChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label='Alcance solicitado (por ejemplo: "solo columnas X,Y,Z; sin datos personales")'
            name="requestedScope"
            value={requestForm.requestedScope}
            onChange={handleRequestFormChange}
            fullWidth
            margin="normal"
            multiline
            minRows={2}
          />
          <TextField
            label="Comentario adicional para el provider (opcional)"
            name="consumerComment"
            value={requestForm.consumerComment}
            onChange={handleRequestFormChange}
            fullWidth
            margin="normal"
            multiline
            minRows={2}
          />

          {requestError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {requestError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRequestDialog} disabled={requestSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitRequest}
            disabled={requestSubmitting}
          >
            Enviar solicitud
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ConsumerLocalCatalog;