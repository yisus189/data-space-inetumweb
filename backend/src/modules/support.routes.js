// backend/src/modules/support/support.routes.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Todas las rutas de soporte requieren estar autenticado
router.use(requireAuth);

/**
 * GET /support/my-conversations
 * CONSUMER/PROVIDER: lista sus propias conversaciones
 */
router.get(
  '/my-conversations',
  requireRole(['CONSUMER', 'PROVIDER']),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const conversations = await prisma.supportConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // solo el último para preview
          },
          operator: {
            select: { id: true, email: true, name: true },
          },
        },
      });

      const result = conversations.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        lastMessagePreview: c.messages[0]?.content || '',
        operator: c.operator,
        updatedAt: c.updatedAt,
      }));

      res.json(result);
    } catch (err) {
      console.error('Error en GET /support/my-conversations', err);
      res
        .status(500)
        .json({ error: 'Error al obtener tus conversaciones de soporte' });
    }
  },
);

/**
 * POST /support/my-conversations
 * CONSUMER/PROVIDER: crear nueva conversación + primer mensaje
 * body: { title, initialMessage }
 */
router.post(
  '/my-conversations',
  requireRole(['CONSUMER', 'PROVIDER']),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, initialMessage } = req.body;

      if (!title || !initialMessage) {
        return res.status(400).json({
          error: 'Título e mensaje inicial son obligatorios',
        });
      }

      const conversation = await prisma.supportConversation.create({
        data: {
          title,
          userId,
          status: 'OPEN',
          messages: {
            create: {
              senderUserId: userId,
              content: initialMessage,
            },
          },
        },
      });

      res.status(201).json(conversation);
    } catch (err) {
      console.error('Error en POST /support/my-conversations', err);
      res
        .status(500)
        .json({ error: 'Error al crear la conversación de soporte' });
    }
  },
);

/**
 * GET /support/conversations/:id
 * CONSUMER/PROVIDER: solo su conversación
 * OPERATOR: puede ver cualquier conversación
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { id: userId, role } = req.user;

    const conversation = await prisma.supportConversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        operator: {
          select: { id: true, email: true, name: true, role: true },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, email: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Permisos:
    // - Consumer/Provider: solo si son el dueño.
    // - Operator: puede ver todas.
    if (
      role === 'CONSUMER' ||
      role === 'PROVIDER'
    ) {
      if (conversation.userId !== userId) {
        return res
          .status(403)
          .json({ error: 'No tienes acceso a esta conversación' });
      }
    } else if (role !== 'OPERATOR') {
      return res
        .status(403)
        .json({ error: 'No tienes permisos para ver esta conversación' });
    }

    // Ajustar forma de respuesta para tu frontend:
    const result = {
      conversation: {
        id: conversation.id,
        title: conversation.title,
        status: conversation.status,
        user: conversation.user,
        operator: conversation.operator,
      },
      messages: conversation.messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderUserId: m.senderUserId,
        sender: m.sender,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };

    res.json(result);
  } catch (err) {
    console.error('Error en GET /support/conversations/:id', err);
    res
      .status(500)
      .json({ error: 'Error al obtener la conversación de soporte' });
  }
});

/**
 * POST /support/conversations/:id/messages
 * CONSUMER/PROVIDER: pueden escribir en sus conversaciones
 * OPERATOR: puede escribir en cualquier conversación
 * body: { content }
 */
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body;
    const { id: userId, role } = req.user;

    if (!content) {
      return res.status(400).json({ error: 'El contenido es obligatorio' });
    }

    const conversation = await prisma.supportConversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Permisos
    if (role === 'CONSUMER' || role === 'PROVIDER') {
      if (conversation.userId !== userId) {
        return res
          .status(403)
          .json({ error: 'No puedes escribir en esta conversación' });
      }
    } else if (role !== 'OPERATOR') {
      return res
        .status(403)
        .json({ error: 'No tienes permisos para escribir en esta conversación' });
    }

    const message = await prisma.supportMessage.create({
      data: {
        conversationId: id,
        senderUserId: userId,
        content,
      },
    });

    // Actualizar updatedAt y, opcionalmente, status
    await prisma.supportConversation.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        status:
          role === 'OPERATOR' ? 'IN_PROGRESS' : 'OPEN', // ajusta si quieres otro flujo
      },
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('Error en POST /support/conversations/:id/messages', err);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
});

/**
 * GET /support/all-conversations
 * SOLO OPERATOR: lista todas las conversaciones
 */
router.get(
  '/all-conversations',
  requireRole(['OPERATOR']),
  async (req, res) => {
    try {
      const conversations = await prisma.supportConversation.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, name: true, role: true },
          },
          operator: {
            select: { id: true, email: true, name: true, role: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      const result = conversations.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        lastMessagePreview: c.messages[0]?.content || '',
        user: c.user,
        operator: c.operator,
        updatedAt: c.updatedAt,
      }));

      res.json(result);
    } catch (err) {
      console.error('Error en GET /support/all-conversations', err);
      res
        .status(500)
        .json({ error: 'Error al obtener conversaciones de soporte' });
    }
  },
);

module.exports = router;