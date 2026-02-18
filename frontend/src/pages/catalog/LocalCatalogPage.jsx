// frontend/src/pages/catalog/LocalCatalogPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  listAllDatasetsAdmin,
  blockDataset,
  unblockDataset,
} from '../../api/catalogApi.js';

function LocalCatalogPage() {
  const [datasets, setDatasets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await listAllDatasetsAdmin();
      setDatasets(data);
      if (!selected && data.length > 0) {
        setSelected(data[0]);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar datasets');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (ds) => {
    setSelected(ds);
  };

  const handleBlock = async () => {
    if (!selected) return;
    try {
      await blockDataset(selected.id);
      await load();
    } catch (err) {
      alert(err.message || 'Error al bloquear dataset');
    }
  };

  const handleUnblock = async () => {
    if (!selected) return;
    try {
      await unblockDataset(selected.id);
      await load();
    } catch (err) {
      alert(err.message || 'Error al desbloquear dataset');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
        Revisión de datasets locales
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Como operador, revisa en detalle los datasets publicados en el Data
        Space. Puedes bloquear aquellos que no cumplan las políticas.
      </Typography>

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {/* Lista lateral */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Datasets publicados
            </Typography>
            {datasets.map((ds) => (
              <Box
                key={ds.id}
                sx={{
                  p: 1,
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  backgroundColor:
                    selected && selected.id === ds.id ? '#e3f2fd' : 'white',
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
                <Box sx={{ mt: 0.5, display: 'flex', gap: 1 }}>
                  <Chip
                    label={
                      ds.blocked || ds.status === 'BLOCKED'
                        ? 'BLOQUEADO'
                        : 'ACTIVO'
                    }
                    color={
                      ds.blocked || ds.status === 'BLOCKED'
                        ? 'error'
                        : 'success'
                    }
                    size="small"
                  />
                  <Chip
                    label={`ID ${ds.id}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
            ))}
            {datasets.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No hay datasets publicados.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Detalle del dataset seleccionado */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, minHeight: 400 }}>
            {selected ? (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {selected.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={
                        selected.blocked || selected.status === 'BLOCKED'
                          ? 'BLOQUEADO'
                          : 'ACTIVO'
                      }
                      color={
                        selected.blocked || selected.status === 'BLOCKED'
                          ? 'error'
                          : 'success'
                      }
                    />
                    <Typography variant="body2" color="text.secondary">
                      ID {selected.id}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  Proveedor:{' '}
                  {selected.provider?.name
                    ? `${selected.provider.name} (${selected.provider.email})`
                    : selected.provider?.email}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  Descripción
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {selected.description || 'Sin descripción'}
                </Typography>

                {/* Si tienes más campos en Dataset, muéstralos aquí */}
                {/* Ejemplos (ajusta a tu modelo real): */}
                {selected.category && (
                  <>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 'bold', mb: 0.5 }}
                    >
                      Categoría
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {selected.category}
                    </Typography>
                  </>
                )}

                {selected.tags && selected.tags.length > 0 && (
                  <>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 'bold', mb: 0.5 }}
                    >
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selected.tags.map((t) => (
                        <Chip key={t} label={t} size="small" />
                      ))}
                    </Box>
                  </>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  {selected.blocked || selected.status === 'BLOCKED' ? (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleUnblock}
                    >
                      Desbloquear dataset
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleBlock}
                    >
                      Bloquear dataset
                    </Button>
                  )}
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Selecciona un dataset de la lista para ver sus detalles.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default LocalCatalogPage;