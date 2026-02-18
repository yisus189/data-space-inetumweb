const express = require('express');
const {
  createDatasetController,
  updateDatasetController,
  publishDatasetController,
  listMyDatasetsController,
  listPublishedDatasetsController,
  getDatasetByIdController,
} = require('./dataset.controller');
const { PrismaClient, DatasetStatus } = require('@prisma/client');
const { requireAuth, requireRole } = require('../../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * RUTAS PÚBLICAS (sin autenticación)
 * - Ver catálogo publicado
 */
router.get('/public', listPublishedDatasetsController);
router.get('/public/:id', getDatasetByIdController);

/**
 * A partir de aquí, se requiere autenticación
 */
router.use(requireAuth);

/**
 * RUTAS PARA PROVIDER (usar requireRole(['PROVIDER']))
 */

// Provider: ver sus datasets (controlador existente)
router.get('/mine', requireRole(['PROVIDER']), listMyDatasetsController);

// Provider: crear dataset (controlador existente)
router.post('/', requireRole(['PROVIDER']), createDatasetController);

// Provider: actualizar dataset propio (controlador existente)
// Si tu controller `updateDatasetController` ya valida que el dataset sea suyo,
// no hace falta duplicar la lógica aquí.
router.patch('/:id', requireRole(['PROVIDER']), updateDatasetController);

// Provider: publicar / despublicar dataset (controlador existente)
router.patch(
  '/:id/publish',
  requireRole(['PROVIDER']),
  publishDatasetController
);

/**
 * RUTAS PARA OPERATOR (nuevas)
 * - Ver todos los datasets
 * - Bloquear / desbloquear
 */

// Operator: listar todos los datasets con info del provider
router.get('/admin', requireRole(['OPERATOR']), async (req, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(datasets);
  } catch (err) {
    console.error('Error en GET /catalog/datasets/admin', err);
    res
      .status(500)
      .json({ error: 'Error al obtener datasets para el operador' });
  }
});

// Operator: bloquear dataset
router.patch('/:id/block', requireRole(['OPERATOR']), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const dataset = await prisma.dataset.findUnique({ where: { id } });
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset no encontrado' });
    }

    const updated = await prisma.dataset.update({
      where: { id },
      data: {
        blocked: true,
        status: DatasetStatus.BLOCKED,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Error en PATCH /catalog/datasets/:id/block', err);
    res.status(500).json({ error: 'Error al bloquear el dataset' });
  }
});

// Operator: desbloquear dataset
router.patch('/:id/unblock', requireRole(['OPERATOR']), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const dataset = await prisma.dataset.findUnique({ where: { id } });
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset no encontrado' });
    }

    const updated = await prisma.dataset.update({
      where: { id },
      data: {
        blocked: false,
        status: DatasetStatus.ACTIVE,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Error en PATCH /catalog/datasets/:id/unblock', err);
    res.status(500).json({ error: 'Error al desbloquear el dataset' });
  }
});

module.exports = router;