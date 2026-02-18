// frontend/src/pages/operator/OperatorUsers.jsx
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
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  listUsersRaw,
  approveUser,
  rejectUser,
  blockUser,
  unblockUser,
  deleteUser,
} from '../../api/userApi.js';

function OperatorUsers() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [existingUsers, setExistingUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listUsersRaw(); // { pending, existing }
      setPendingUsers(data.pending || []);
      setExistingUsers(data.existing || []);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const isSuspended = (user) => user.status === 'SUSPENDED';

  const handleApprove = async (user) => {
    try {
      await approveUser(user.id);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Error al aprobar usuario');
    }
  };

  const handleReject = async (user) => {
    try {
      await rejectUser(user.id);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Error al rechazar usuario');
    }
  };

  const handleBlockToggle = async (user) => {
    try {
      if (isSuspended(user)) {
        await unblockUser(user.id); // SUSPENDED -> ACTIVE
      } else {
        await blockUser(user.id); // ACTIVE/REJECTED -> SUSPENDED
      }
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Error al actualizar el estado del usuario');
    }
  };

  const handleDelete = async (user) => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar al usuario ${user.email}? Esta acción no se puede deshacer.`,
    );
    if (!confirmDelete) return;

    try {
      await deleteUser(user.id);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Error al eliminar el usuario');
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'CONSUMER':
        return 'Consumer';
      case 'PROVIDER':
        return 'Provider';
      case 'OPERATOR':
        return 'Operator';
      default:
        return role;
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}
      >
        Usuarios y roles
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Gestiona las solicitudes de nuevos usuarios y los usuarios que ya están
        registrados en el Data Space.
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Paper>
      )}

      {/* Caja 1: Solicitudes de nuevos usuarios */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Solicitudes de nuevos usuarios
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Revisa los usuarios pendientes de aprobación. Solo los usuarios
          aprobados podrán iniciar sesión.
        </Typography>

        {loading && pendingUsers.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Cargando solicitudes...
          </Typography>
        )}

        {!loading && pendingUsers.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No hay solicitudes pendientes.
          </Typography>
        )}

        <Grid container spacing={2}>
          {pendingUsers.map((u) => (
            <Grid item xs={12} md={6} lg={4} key={u.id}>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {u.name || u.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {u.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {u.country} {u.city ? `- ${u.city}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Teléfono: {u.phone || '—'}
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      label={getRoleLabel(u.role)}
                      color={u.role === 'PROVIDER' ? 'secondary' : 'primary'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip label={u.status} size="small" />
                  </Box>
                </CardContent>
                <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleApprove(u)}
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={() => handleReject(u)}
                  >
                    Rechazar
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Caja 2: Usuarios existentes */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Usuarios del Data Space
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Lista de usuarios ya registrados (activos, suspendidos o rechazados).
        </Typography>

        <Paper sx={{ p: 2 }}>
          {loading && existingUsers.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Cargando usuarios...
            </Typography>
          )}

          {!loading && existingUsers.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No hay usuarios registrados.
            </Typography>
          )}

          {!loading && existingUsers.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Actualizado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {existingUsers.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.name || '—'}</TableCell>
                    <TableCell>{getRoleLabel(u.role)}</TableCell>
                    <TableCell>
                      {isSuspended(u) ? (
                        <Chip
                          label="Suspendido"
                          color="error"
                          size="small"
                          icon={<BlockIcon fontSize="small" />}
                        />
                      ) : u.status === 'ACTIVE' ? (
                        <Chip
                          label="Activo"
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon fontSize="small" />}
                        />
                      ) : u.status === 'REJECTED' ? (
                        <Chip label="Rechazado" color="default" size="small" />
                      ) : (
                        <Chip label={u.status} size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {u.updatedAt
                        ? new Date(u.updatedAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={
                          isSuspended(u)
                            ? 'Reactivar usuario'
                            : 'Suspender usuario'
                        }
                      >
                        <IconButton
                          size="small"
                          color={isSuspended(u) ? 'success' : 'error'}
                          onClick={() => handleBlockToggle(u)}
                        >
                          {isSuspended(u) ? (
                            <CheckCircleIcon fontSize="small" />
                          ) : (
                            <BlockIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar usuario">
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => handleDelete(u)}
                          sx={{ ml: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default OperatorUsers;