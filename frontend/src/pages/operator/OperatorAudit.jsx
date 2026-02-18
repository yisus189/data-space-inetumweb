// frontend/src/pages/operator/OperatorAudit.jsx
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
import { getGlobalAudit } from '../../api/auditApi.js';

// Función de formato de fecha/hora
function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleString();
}

function OperatorAudit() {
  const [entries, setEntries] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [userFilter, setUserFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const loadAudit = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getGlobalAudit(); // usa tu función real del api
      setEntries(data);
      setFiltered(data);
    } catch (err) {
      setError(err.message || 'Error al cargar la auditoría global');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  // Reaplicar filtros
  useEffect(() => {
    let data = [...entries];

    if (userFilter.trim()) {
      data = data.filter((e) =>
        (e.userEmail || '')
          .toLowerCase()
          .includes(userFilter.trim().toLowerCase())
      );
    }

    if (roleFilter) {
      data = data.filter((e) => e.userRole === roleFilter);
    }

    if (actionFilter) {
      data = data.filter((e) => e.action === actionFilter);
    }

    setFiltered(data);
  }, [userFilter, roleFilter, actionFilter, entries]);

  // Extraer roles y acciones distintas para los selects
  const distinctRoles = Array.from(
    new Set(entries.map((e) => e.userRole).filter(Boolean))
  );
  const distinctActions = Array.from(
    new Set(entries.map((e) => e.action).filter(Boolean))
  );

  return (
    <Box>
      {/* Encabezado */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Auditoría global del Data Space
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Consulta todas las acciones relevantes realizadas por los usuarios
          sobre los datasets y contratos del Data Space. Usa los filtros para
          localizar eventos específicos.
        </Typography>
      </Box>

      {/* Filtros en una tarjeta */}
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
              label="Usuario (email)"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
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
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Rol"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              {distinctRoles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
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
            Registros de auditoría
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? 'Cargando...'
              : `${filtered.length} evento${
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
                <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Dataset</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Acción</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Finalidad</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contrato</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No hay registros de auditoría que coincidan con los
                      filtros seleccionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((entry, idx) => {
                // Ajusta estos nombres de campo a la estructura real que devuelva tu backend
                const {
                  timestamp,
                  userEmail,
                  userRole,
                  datasetName,
                  providerId,
                  action,
                  purpose,
                  contractId,
                  contractStatus,
                } = entry;

                return (
                  <TableRow key={idx} hover>
                    <TableCell>{formatDate(timestamp)}</TableCell>
                    <TableCell>{userEmail || '—'}</TableCell>
                    <TableCell>
                      {userRole ? (
                        <Chip
                          label={userRole}
                          size="small"
                          color={
                            userRole === 'OPERATOR'
                              ? 'primary'
                              : userRole === 'PROVIDER'
                              ? 'success'
                              : 'default'
                          }
                          variant="outlined"
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{datasetName || '—'}</TableCell>
                    <TableCell>{providerId ?? '—'}</TableCell>
                    <TableCell>
                      {action ? (
                        <Chip
                          label={action}
                          size="small"
                          color={
                            action === 'DOWNLOAD'
                              ? 'primary'
                              : action === 'ACCESS_REQUEST'
                              ? 'secondary'
                              : 'default'
                          }
                          variant="outlined"
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 260,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={purpose}
                      >
                        {purpose || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {contractId ? (
                        <Chip
                          label={`${contractId} (${contractStatus || '—'})`}
                          size="small"
                          color={
                            contractStatus === 'ACTIVE'
                              ? 'success'
                              : contractStatus === 'REVOKED'
                              ? 'error'
                              : 'default'
                          }
                          variant="outlined"
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
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

export default OperatorAudit;