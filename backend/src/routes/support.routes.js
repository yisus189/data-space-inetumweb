// backend/src/routes/support.routes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js'; // ajusta si el nombre/ruta es otro
import * as supportController from '../controllers/supportController.js';

const router = express.Router();

// Todas las rutas requieren usuario autenticado
router.use(authMiddleware);

// Consumer / Provider: listar sus conversaciones
router.get('/conversations/mine', supportController.listMyConversations);

// Consumer / Provider: crear conversación
router.post('/conversations', supportController.createConversation);

// Obtener una conversación (según permisos)
router.get('/conversations/:id', supportController.getConversation);

// Enviar mensaje
router.post('/conversations/:id/messages', supportController.postMessage);

// Operator: listar todas las conversaciones (con filtros por query)
router.get('/conversations', supportController.listAllConversations);

// Operator: actualizar estado / asignar operador
router.patch('/conversations/:id', supportController.updateConversation);

export default router;