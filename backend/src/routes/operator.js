const express = require('express');
const { PrismaClient, UserStatus } = require('@prisma/client');
const { requireAuth, requireOperator } = require('../auth');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /operator/users?status=PENDING
 * Lista usuarios (por defecto, pendientes)
 */
router.get('/users', requireAuth, requireOperator, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error('Error en GET /operator/users', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

/**
 * POST /operator/users/:id/approve
 */
router.post('/users/:id/approve', requireAuth, requireOperator, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
    });
    res.json(user);
  } catch (err) {
    console.error('Error en POST /operator/users/:id/approve', err);
    res.status(500).json({ error: 'Error al aprobar usuario' });
  }
});

/**
 * POST /operator/users/:id/reject
 */
router.post('/users/:id/reject', requireAuth, requireOperator, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.update({
      where: { id },
      data: { status: UserStatus.REJECTED },
    });
    res.json(user);
  } catch (err) {
    console.error('Error en POST /operator/users/:id/reject', err);
    res.status(500).json({ error: 'Error al rechazar usuario' });
  }
});

module.exports = router;