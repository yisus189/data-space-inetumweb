// frontend/src/pages/provider/ProviderDatasetsEdit.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  MenuItem,
} from '@mui/material';
import {
  listMyDatasets,
  updateMyDataset,
  togglePublishDataset,
  createDataset,
} from '../../api/catalogApi.js';

function ProviderDatasetsEdit() {
  const [datasets, setDatasets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    storageType: 'FILE',   // valor por defecto
    storageUri: '',
    legalBasis: '',
    dataClassification: '',
    usageTerms: '',
    published: false,
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const loadDatasets = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await listMyDatasets();
      setDatasets(data);

      if (isCreating) return; // no tocar el formulario en modo creación

      if (!selected && data.length > 0) {
        const first = data[0];
        setSelected(first);
        setFormFromDataset(first);
      } else if (selected) {
        const updatedSel = data.find((d) => d.id === selected.id);
        if (updatedSel) {
          setSelected(updatedSel);
          setFormFromDataset(updatedSel);
        } else {
          setSelected(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Error al cargar datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFormFromDataset = (ds) => {
    setForm({
      name: ds.name || '',
      description: ds.description || '',
      category: ds.category || '',
      tags: Array.isArray(ds.tags) ? ds.tags.join(', ') : ds.tags || '',
      storageType: ds.storageType || 'FILE',
      storageUri: ds.storageUri || '',
      legalBasis: ds.legalBasis || '',
      dataClassification: ds.dataClassification || '',
      usageTerms: ds.usageTerms || '',
      published: !!ds.published,
    });
  };

  const resetCreateForm = () => {
    setForm({
      name: '',
      description: '',
      category: '',
      tags: '',
      storageType: 'FILE',
      storageUri: '',
      legalBasis: '',
      dataClassification: '',
      usageTerms: '',
      published: false,
    });
  };

  const handleSelect = (ds) => {
    setIsCreating(false);
    setSelected(ds);
    setFormFromDataset(ds);
    setError('');
    setInfo('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        tags:
          typeof form.tags === 'string'
            ? form.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : form.tags,
        storageType: form.storageType,
        storageUri: form.storageUri,
        legalBasis: form.legalBasis,
        dataClassification: form.dataClassification,
        usageTerms: form.usageTerms,
        published: form.published,
      };

      if (isCreating) {
        const created = await createDataset(payload);
        setInfo('Dataset creado correctamente.');
        setIsCreating(false);
        setSelected(created);
      } else {
        if (!selected) return;
        await updateMyDataset(selected.id, payload);
        setInfo('Dataset actualizado correctamente.');
      }

      await loadDatasets();
    } catch (err) {
      setError(
        err.message ||
          (isCreating
            ? 'Error al crear dataset'
            : 'Error al actualizar dataset')
      );
    }
  };

  const handleTogglePublish = async () => {
    if (!selected || isCreating) return;
    setError('');
    setInfo('');

    if (selected.blocked || selected.status === 'BLOCKED') {
      setError(
        'Este dataset está bloqueado por el operador y no puede cambiar su estado de publicación.'
      );
      return;
    }

    try {
      const shouldPublish = !selected.published && selected.status !== 'BLOCKED';
      await togglePublishDataset(selected.id, shouldPublish);
      setInfo(
        shouldPublish
          ? 'Dataset publicado correctamente.'
          : 'Dataset despublicado correctamente.'
      );
      await loadDatasets();
    } catch (err) {
      setError(err.message || 'Error al cambiar el estado de publicación');
    }
  };

  const isBlocked =
    !isCreating && selected && (selected.blocked || selected.status === 'BLOCKED');
  const isPublished = !isCreating && selected && !!selected.published;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
        Mis datasets
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Gestiona la información de tus datasets y decide cuáles estarán
        publicados en el Data Space (visibles para los consumidores). Los
        datasets bloqueados por el operador no pueden ser editados ni
        publicados.
      </Typography>

      <Grid container spacing={3}>
        {/* Lista */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Lista de mis datasets
            </Typography>

            {datasets.map((ds) => {
              const dsBlocked = ds.blocked || ds.status === 'BLOCKED';
              const dsPublished = !!ds.published;

              return (
                <Box
                  key={ds.id}
                  sx={{
                    p: 1,
                    mb: 1,
                    borderRadius: 1,
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    backgroundColor:
                      !isCreating &&
                      selected &&
                      selected.id === ds.id
                        ? '#e3f2fd'
                        : 'white',
                  }}
                  onClick={() => handleSelect(ds)}
                >
                  <Typography variant="subtitle1">{ds.name}</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                  >
                    {ds.description}
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={dsBlocked ? 'BLOQUEADO' : 'ACTIVO'}
                      color={dsBlocked ? 'error' : 'success'}
                      size="small"
                    />
                    <Chip
                      label={dsPublished ? 'PUBLICADO' : 'NO PUBLICADO'}
                      color={dsPublished ? 'primary' : 'default'}
                      size="small"
                      variant={dsPublished ? 'filled' : 'outlined'}
                    />
                  </Box>
                </Box>
              );
            })}
            {datasets.length === 0 && !loading && (
              <Typography variant="body2" color="text.secondary">
                No tienes datasets registrados aún.
              </Typography>
            )}
            {loading && (
              <Typography variant="body2" color="text.secondary">
                Cargando...
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Detalle / creación (botón crear en la derecha) */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="h6">
                {isCreating ? 'Crear nuevo dataset' : 'Detalle del dataset'}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setIsCreating(true);
                  setSelected(null);
                  resetCreateForm();
                  setError('');
                  setInfo('');
                }}
              >
                CREAR DATASET
              </Button>
            </Box>

            {isCreating || selected ? (
              <Box component="form" onSubmit={handleSave}>
                {/* Estado solo en modo edición */}
                {!isCreating && selected && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      mb: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Chip
                      label={isBlocked ? 'BLOQUEADO' : 'ACTIVO'}
                      color={isBlocked ? 'error' : 'success'}
                    />
                    <Chip
                      label={isPublished ? 'PUBLICADO' : 'NO PUBLICADO'}
                      color={isPublished ? 'primary' : 'default'}
                      variant={isPublished ? 'filled' : 'outlined'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ID {selected.id}
                    </Typography>
                  </Box>
                )}

                <TextField
                  label="Nombre"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  disabled={isBlocked}
                />
                <TextField
                  label="Descripción"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  multiline
                  minRows={3}
                  disabled={isBlocked}
                />

                <TextField
                  label="Categoría"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  disabled={isBlocked}
                />

                <TextField
                  label="Tags (separados por coma)"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  disabled={isBlocked}
                />

                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <TextField
                        select
                        label="Tipo de almacenamiento"
                        name="storageType"
                        value={form.storageType}
                        onChange={(e) => {
                            handleChange(e);
                            // si cambia a FILE y venías de URL, limpiamos nombre de archivo
                            if (e.target.value !== 'FILE') {
                            setSelectedFileName('');
                            }
                        }}
                        fullWidth
                        margin="normal"
                        disabled={isBlocked}
                        >
                        <MenuItem value="FILE">Archivo</MenuItem>
                        <MenuItem value="URL">URL</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Si es URL, mismo comportamiento de antes */}
                    {form.storageType === 'URL' && (
                        <Grid item xs={12} md={8}>
                        <TextField
                            label="URL del recurso"
                            name="storageUri"
                            value={form.storageUri}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            disabled={isBlocked}
                        />
                        </Grid>
                    )}

                    {/* Si es FILE, mostramos botón de selección de archivo + nombre */}
                    {form.storageType === 'FILE' && (
                        <Grid item xs={12} md={8}>
                        <Box
                            sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 2,
                            }}
                        >
                            <Button
                            variant="outlined"
                            component="label"
                            disabled={isBlocked}
                            >
                            Seleccionar archivo
                            <input
                                type="file"
                                hidden
                                onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setSelectedFileName(file.name);
                                    // aquí solo guardamos el nombre en storageUri;
                                    // si luego subes el binario a tu backend, ajustarás esta parte
                                    setForm((prev) => ({
                                    ...prev,
                                    storageUri: file.name,
                                    }));
                                }
                                }}
                            />
                            </Button>

                            <Typography variant="body2" color="text.secondary" noWrap>
                            {selectedFileName || form.storageUri || 'Ningún archivo seleccionado'}
                            </Typography>
                        </Box>
                        </Grid>
                    )}
                </Grid>

                <TextField
                  label="Base legal"
                  name="legalBasis"
                  value={form.legalBasis}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  disabled={isBlocked}
                />

                <TextField
                  label="Clasificación de datos"
                  name="dataClassification"
                  value={form.dataClassification}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  disabled={isBlocked}
                />

                <TextField
                  label="Términos de uso"
                  name="usageTerms"
                  value={form.usageTerms}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  multiline
                  minRows={2}
                  disabled={isBlocked}
                />

                {isBlocked && !isCreating && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    Este dataset está bloqueado por el operador. No puedes
                    modificar su información ni su estado de publicación.
                  </Typography>
                )}

                {error && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
                {info && (
                  <Typography color="success.main" sx={{ mt: 1 }}>
                    {info}
                  </Typography>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isBlocked && !isCreating}
                  >
                    {isCreating ? 'Crear dataset' : 'Guardar cambios'}
                  </Button>

                  {!isCreating && (
                    <Button
                      type="button"
                      variant="outlined"
                      color={isPublished ? 'inherit' : 'primary'}
                      onClick={handleTogglePublish}
                      disabled={isBlocked}
                    >
                      {isPublished ? 'Despublicar dataset' : 'Publicar dataset'}
                    </Button>
                  )}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Selecciona un dataset de la lista o pulsa "CREAR DATASET" para
                registrar uno nuevo.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProviderDatasetsEdit;