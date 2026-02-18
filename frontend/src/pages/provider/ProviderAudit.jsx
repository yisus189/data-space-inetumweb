// frontend/src/pages/provider/ProviderAudit.jsx
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getProviderAudit } from '../../api/auditApi.js';

function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleString();
}

function ProviderAudit() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // filtros
  const [actionFilter, setActionFilter] = useState('');
  const [textFilter, setTextFilter] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProviderAudit();
      setLogs(data);
      setFiltered(data);
    } catch (err) {
      setError(err.message || 'Error al cargar auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // aplicar filtros
  useEffect(() => {
    let data = [...logs];

    if (actionFilter) {
      data = data.filter((l) => l.action === actionFilter);
    }

    if (textFilter.trim()) {
      const term = textFilter.trim().toLowerCase();
      data = data.filter(
        (l) =>
          (l.user?.email || `${l.userId || ''}`)
            .toLowerCase()
            .includes(term) ||
          (l.dataset?.name || `${l.datasetId || ''}`)
            .toLowerCase()
            .includes(term) ||
          (l.purpose || '').toLowerCase().includes(term) ||
          (l.ipAddress || '').toLowerCase().includes(term)
      );
    }

    setFiltered(data);
  }, [actionFilter, textFilter, logs]);

  const distinctActions = Array.from(
    new Set(logs.map((l) => l.action).filter(Boolean))
  );

  const getActionChipProps = (action) => {
    switch (action) {
      case 'DOWNLOAD':
        return { label: 'DESCARGA', color: 'primary' };
      case 'ACCESS':
        return { label: 'ACCESO', color: 'success' };
      case 'VIEW':
        return { label: 'VISUALIZACIÓN', color: 'info' };
      default:
        return { label: action || 'ACCIÓN', color: 'default' };
    }
  };

  const getContractChipProps = (contract) => {
    if (!contract) return { label: 'Sin contrato', color: 'default' };
    switch (contract.status) {
      case 'ACTIVE':
        return { label: `${contract.id} (ACTIVO)`, color: 'success' };
      case 'EXPIRED':
        return { label: `${contract.id} (EXPIRADO)`, color: 'default' };
      case 'REVOKED':
        return { label: `${contract.id} (REVOCADO)`, color: 'error' };
      default:
        return {
          label: `${contract.id} (${contract.status || 'DESCONOCIDO'})`,
          color: 'default',
        };
    }
  };

  return (
    <Box>
      {/* Encabezado */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Auditoría de accesos a mis datasets
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Consulta quién ha accedido a tus datasets, qué acción realizó, con qué
          finalidad y bajo qué contrato. Usa los filtros para localizar accesos
          concretos.
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
              label="Acción"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">Todas</MenuItem>
              {distinctActions.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              label="Buscar (usuario, dataset, finalidad, IP)"
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
            Registros de acceso
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? 'Cargando...'
              : `${filtered.length} acceso${
                  filtered.length === 1 ? '' : 's'
                } encontrado${
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
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha / hora</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Dataset</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Acción</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Finalidad</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contrato</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No hay accesos registrados que coincidan con los filtros
                      seleccionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((l) => {
                const actionProps = getActionChipProps(l.action);
                const contractProps = getContractChipProps(l.contract);

                return (
                  <TableRow key={l.id} hover>
                    <TableCell>{formatDate(l.timestamp)}</TableCell>
                    <TableCell>{l.user?.email || l.userId}</TableCell>
                    <TableCell>{l.dataset?.name || l.datasetId}</TableCell>
                    <TableCell>
                      <Chip
                        label={actionProps.label}
                        size="small"
                        color={actionProps.color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 240,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={l.purpose}
                      >
                        {l.purpose || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contractProps.label}
                        size="small"
                        color={contractProps.color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{l.ipAddress || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
}

export default ProviderAudit;