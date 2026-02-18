// frontend/src/pages/support/SupportConversationView.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import {
  getSupportConversation,
  sendSupportMessage,
} from '../../api/supportApi.js';
import { useAuth } from '../../context/AuthContext.jsx'; // si tienes contexto de usuario

function SupportConversationView() {
  const { id } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const { user } = useAuth() || {}; // ajusta según tu contexto

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSupportConversation(id);
      setConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || 'Error al cargar la conversación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // opcional: interval/polling cada X segundos
    // const interval = setInterval(load, 10000);
    // return () => clearInterval(interval);
  }, [id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      setSending(true);
      await sendSupportMessage(id, messageText.trim());
      setMessageText('');
      await load();
    } catch (err) {
      setError(err.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (msg) =>
    user && msg.senderUserId === user.id;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
        Detalle del ticket de soporte
      </Typography>

      {conversation && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {conversation.title}
        </Typography>
      )}

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          mb: 2,
          height: 420,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            pr: 1,
          }}
        >
          {loading && (
            <Typography variant="body2" color="text.secondary">
              Cargando conversación...
            </Typography>
          )}

          {!loading && messages.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 4 }}
            >
              Aún no hay mensajes en esta conversación.
            </Typography>
          )}

          {messages.map((m) => (
            <Box
              key={m.id}
              sx={{
                display: 'flex',
                justifyContent: isMyMessage(m) ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: isMyMessage(m) ? 'primary.main' : 'grey.200',
                  color: isMyMessage(m) ? 'white' : 'text.primary',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    textAlign: 'right',
                    opacity: 0.8,
                  }}
                >
                  {new Date(m.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Caja de envío */}
      <Box component="form" onSubmit={handleSend}>
        <TextField
          placeholder="Escribe tu mensaje para el operador..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            type="submit"
            disabled={sending || !messageText.trim()}
          >
            {sending ? 'Enviando...' : 'Enviar mensaje'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default SupportConversationView;