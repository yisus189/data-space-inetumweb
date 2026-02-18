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
  Button,
  Chip,
} from '@mui/material';
import {
  listAllDatasetsAdmin,
  blockDataset,
  unblockDataset,
} from '../../api/catalogApi.js';

function OperatorDatasets() {
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await listAllDatasetsAdmin();
      setDatasets(data);
    } catch (err) {
      setError(err.message || 'Error al cargar datasets');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBlock = async (id) => {
    try {
      await blockDataset(id);
      await load();
    } catch (err) {
      alert(err.message || 'Error al bloquear dataset');
    }
  };

  const handleUnblock = async (id) => {
    try {
      await unblockDataset(id);
      await load();
    } catch (err) {
      alert(err.message || 'Error al desbloquear dataset');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
        Datasets publicados
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Revisa los datasets publicados por los proveedores y bloquea aquellos
        que no cumplan las políticas del Data Space.
      </Typography>

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Creado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.map((ds) => (
              <TableRow key={ds.id}>
                <TableCell>{ds.id}</TableCell>
                <TableCell>{ds.name}</TableCell>
                <TableCell>
                  {ds.provider?.name} ({ds.provider?.email})
                </TableCell>
                <TableCell>
                  {ds.blocked || ds.status === 'BLOCKED' ? (
                    <Chip label="BLOQUEADO" color="error" size="small" />
                  ) : (
                    <Chip label="ACTIVO" color="success" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  {new Date(ds.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {ds.blocked || ds.status === 'BLOCKED' ? (
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      onClick={() => handleUnblock(ds.id)}
                    >
                      Desbloquear
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleBlock(ds.id)}
                    >
                      Bloquear
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {datasets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    No hay datasets publicados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default OperatorDatasets;