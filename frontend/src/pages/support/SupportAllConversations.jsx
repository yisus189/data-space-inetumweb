// frontend/src/pages/support/SupportAllConversations.jsx
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { listAllSupportConversations } from '../../api/supportApi.js';

function SupportAllConversations() {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listAllSupportConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message || 'Error al cargar las conversaciones de soporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getStatusChipProps = (status) => {
    switch (status) {
      case 'OPEN':
        return { label: 'ABIERTA', color: 'primary' };
      case 'IN_PROGRESS':
        return { label: 'EN PROGRESO', color: 'warning' };
      case 'CLOSED':
        return { label: 'CERRADA', color: 'default' };
      default:
        return { label: status || 'DESCONOCIDO', color: 'default' };
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Soporte y ayuda (Operador)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Gestiona todos los tickets de soporte creados por consumidores y proveedores.
          Revisa el detalle de cada conversación y responde a los usuarios.
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Cargando tickets de soporte...
          </Typography>
        )}

        {!loading && conversations.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No hay tickets de soporte registrados.
          </Typography>
        )}

        {!loading && conversations.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol usuario</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Último mensaje</TableCell>
                <TableCell>Actualizado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conversations.map((c) => {
                const { label, color } = getStatusChipProps(c.status);
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>
                      {c.user?.name
                        ? `${c.user.name} (${c.user.email})`
                        : c.user?.email}
                    </TableCell>
                    <TableCell>{c.user?.role}</TableCell>
                    <TableCell>
                      <Chip label={label} color={color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap maxWidth={260}>
                        {c.lastMessagePreview || 'Sin mensajes aún'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(c.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          navigate(`/support/conversations/${c.id}`)
                        }
                      >
                        Ver conversación
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}

export default SupportAllConversations;