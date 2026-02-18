// frontend/src/pages/support/SupportMyConversations.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  listMySupportConversations,
  createSupportConversation,
} from '../../api/supportApi.js';

function SupportMyConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    initialMessage: '',
  });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listMySupportConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message || 'Error al cargar conversaciones de soporte');
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

  const openCreateDialog = () => {
    setCreateForm({ title: '', initialMessage: '' });
    setCreateError('');
    setCreateOpen(true);
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateConversation = async () => {
    if (!createForm.title.trim() || !createForm.initialMessage.trim()) {
      setCreateError('Título y mensaje inicial son obligatorios.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError('');
      const conv = await createSupportConversation({
        title: createForm.title.trim(),
        initialMessage: createForm.initialMessage.trim(),
      });
      setCreateOpen(false);
      setCreateLoading(false);
      // Ir directamente al chat de la nueva conversación
      navigate(`/support/conversations/${conv.id}`);
    } catch (err) {
      setCreateError(
        err.message || 'Error al crear la conversación de soporte'
      );
      setCreateLoading(false);
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Soporte y ayuda
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Consulta y gestiona tus conversaciones de soporte con el operador del
          Data Space. Abre un nuevo ticket cuando detectes una incidencia o
          necesites ayuda.
        </Typography>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Mis tickets de soporte
          </Typography>
          <Button variant="contained" onClick={openCreateDialog}>
            Nuevo ticket
          </Button>
        </Box>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <List>
          {conversations.map((c) => {
            const { label, color } = getStatusChipProps(c.status);
            return (
              <ListItemButton
                key={c.id}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                }}
                onClick={() => navigate(`/support/conversations/${c.id}`)}
              >
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold' }}>
                        {c.title}
                      </Typography>
                      <Chip label={label} size="small" color={color} />
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                    >
                      {c.lastMessagePreview || 'Sin mensajes aún'}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
          {conversations.length === 0 && !loading && (
            <Typography variant="body2" color="text.secondary">
              Aún no has abierto ningún ticket de soporte.
            </Typography>
          )}
          {loading && (
            <Typography variant="body2" color="text.secondary">
              Cargando...
            </Typography>
          )}
        </List>
      </Paper>

      {/* Diálogo para crear ticket */}
      <Dialog
        open={createOpen}
        onClose={() => {
          if (createLoading) return;
          setCreateOpen(false);
          setCreateError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nuevo ticket de soporte</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Título del ticket"
            name="title"
            value={createForm.title}
            onChange={handleCreateChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Describe el problema o la consulta"
            name="initialMessage"
            value={createForm.initialMessage}
            onChange={handleCreateChange}
            fullWidth
            margin="normal"
            multiline
            minRows={3}
          />
          {createError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {createError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (createLoading) return;
              setCreateOpen(false);
              setCreateError('');
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateConversation}
            disabled={createLoading}
          >
            {createLoading ? 'Creando...' : 'Crear ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SupportMyConversations;