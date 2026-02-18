// frontend/src/pages/operator/OperatorNegotiationTypes.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  listNegotiationTypes,
  createNegotiationType,
  updateNegotiationType,
  deleteNegotiationType,
} from '../../api/contractsApi.js';

function OperatorNegotiationTypes() {
  const theme = useTheme();

  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    template: '',
  });
  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Diálogo de confirmación de borrado
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const loadTypes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listNegotiationTypes();
      setTypes(data);
    } catch (err) {
      setError(err.message || 'Error al cargar tipos de negociación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm({ name: '', description: '', template: '' });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    try {
      if (editingId) {
        await updateNegotiationType(editingId, form);
        setSuccess('Tipo de negociación actualizado correctamente.');
      } else {
        await createNegotiationType(form);
        setSuccess('Tipo de negociación creado correctamente.');
      }
      resetForm();
      await loadTypes();
    } catch (err) {
      setError(
        err.message ||
          (editingId
            ? 'Error al actualizar el tipo de negociación'
            : 'Error al crear el tipo de negociación')
      );
    }
  };

  const handleEdit = (type) => {
    setEditingId(type.id);
    setForm({
      name: type.name || '',
      description: type.description || '',
      template: type.template || '',
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDeleteDialog = (type) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTypeToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    setError('');
    setSuccess('');
    try {
      await deleteNegotiationType(typeToDelete.id);
      setSuccess('Tipo de negociación eliminado correctamente.');
      await loadTypes();
    } catch (err) {
      setError(err.message || 'Error al eliminar el tipo de negociación');
    } finally {
      handleCloseDeleteDialog();
    }
  };

  return (
    <Box>
      {/* Título principal */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Tipos de negociación
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Define plantillas estándar de contrato que se usarán en las negociaciones
          entre consumidores y providers dentro del Data Space.
        </Typography>
      </Box>

      <Grid container spacing={3} alignItems="flex-start">
        {/* Panel de creación/edición */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={4}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              background:
                'linear-gradient(135deg, #ffffff 0%, #f5f7fb 50%, #eef3ff 100%)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              {editingId ? 'Editar tipo de negociación' : 'Crear nuevo tipo'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Especifica un nombre claro, una descripción y la plantilla base del
              contrato (puede contener variables que luego se completarán).
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label="Nombre"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                size="small"
              />
              <TextField
                label="Descripción"
                name="description"
                value={form.description}
                onChange={handleChange}
                fullWidth
                size="small"
                multiline
                minRows={2}
              />
              <TextField
                label="Plantilla de contrato (texto)"
                name="template"
                value={form.template}
                onChange={handleChange}
                fullWidth
                size="small"
                multiline
                minRows={5}
              />

              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
              {success && (
                <Typography color="success.main" variant="body2">
                  {success}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ fontWeight: 'bold' }}
                >
                  {editingId ? 'Guardar cambios' : 'Crear tipo'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outlined"
                    color="inherit"
                    onClick={resetForm}
                  >
                    Cancelar edición
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Tabla de tipos existentes */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Tipos existentes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {loading
                  ? 'Cargando...'
                  : `${types.length} tipo${types.length === 1 ? '' : 's'} definido${
                      types.length === 1 ? '' : 's'
                    }`}
              </Typography>
            </Box>

            <Box sx={{ maxHeight: 420, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Plantilla de contrato
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 'bold', textAlign: 'center', width: 120 }}
                    >
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {types.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textAlign: 'center', py: 2 }}
                        >
                          No hay tipos de negociación definidos todavía.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {types.map((type) => (
                    <TableRow key={type.id} hover>
                      <TableCell>{type.id}</TableCell>
                      <TableCell>{type.name}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          noWrap
                          title={type.description}
                        >
                          {type.description || '—'}
                        </Typography>
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
                          title={type.template}
                        >
                          {type.template || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar" arrow>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(type)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar" arrow>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteDialog(type)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Diálogo de confirmación de borrado */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar tipo de negociación</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Seguro que deseas eliminar el tipo{' '}
            <strong>{typeToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OperatorNegotiationTypes;