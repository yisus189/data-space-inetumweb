const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Todas las rutas de contratos requieren autenticación
router.use(requireAuth);

/**
 * GET /contracts
 * Lista contratos:
 * - CONSUMER: contratos donde es consumidor
 * - PROVIDER: contratos donde es proveedor
 * - OPERATOR: todos los contratos
 */
router.get('/', async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let where = {};
    if (role === 'CONSUMER') {
      where = { consumerId: userId };
    } else if (role === 'PROVIDER') {
      where = { providerId: userId };
    } else if (role === 'OPERATOR') {
      where = {}; // todos
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        dataset: {
          select: { id: true, name: true },
        },
        provider: {
          select: { id: true, email: true, name: true },
        },
        consumer: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    const result = contracts.map((c) => ({
      id: c.id,
      dataset: c.dataset,
      provider: c.provider,
      consumer: c.consumer,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error en GET /contracts', err);
    res.status(500).json({ error: 'Error al obtener los contratos' });
  }
});

/**
 * GET /contracts/:id
 * Si ya tienes este endpoint, mantenlo; si no, aquí tienes una versión básica
 * que incluye la política ODRL del dataset (si existe).
 */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        dataset: {
          include: { odrlPolicy: true }, // si no tienes odrlPolicy, quita esta línea
          select: { id: true, name: true, odrlPolicy: true },
        },
        provider: {
          select: { id: true, email: true, name: true },
        },
        consumer: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    res.json(contract);
  } catch (err) {
    console.error('Error en GET /contracts/:id', err);
    res.status(500).json({ error: 'Error al obtener el contrato' });
  }
});

module.exports = router;