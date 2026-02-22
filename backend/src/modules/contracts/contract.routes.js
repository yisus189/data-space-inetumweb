const express = require('express');
const prisma = require('../../config/db');
const { requireAuth } = require('../../middleware/auth');
const {
  setContractOdrlPolicyController,
  getContractOdrlPolicyController
} = require('./contract.controller');

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
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        dataset: {
          select: { id: true, name: true }
        },
        provider: {
          select: { id: true, email: true, name: true }
        },
        consumer: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    const result = contracts.map((c) => ({
      id: c.id,
      dataset: c.dataset,
      provider: c.provider,
      consumer: c.consumer,
      status: c.status,
      effectiveFrom: c.effectiveFrom,
      effectiveTo: c.effectiveTo,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.json(result);
  } catch (err) {
    console.error('Error en GET /contracts', err);
    res.status(500).json({ error: 'Error al obtener los contratos' });
  }
});

/**
 * GET /contracts/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        dataset: {
          select: { id: true, name: true }
        },
        provider: {
          select: { id: true, email: true, name: true }
        },
        consumer: {
          select: { id: true, email: true, name: true }
        },
        accessRequest: {
          select: {
            id: true,
            requestedPurpose: true,
            requestedDuration: true,
            requestedScope: true,
            agreedPurpose: true,
            agreedDuration: true,
            agreedScope: true,
            status: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    // Permisos básicos por rol
    if (
      req.user.role !== 'OPERATOR' &&
      contract.provider.id !== req.user.id &&
      contract.consumer.id !== req.user.id
    ) {
      return res.status(403).json({ error: 'No tienes permisos para ver este contrato' });
    }

    res.json(contract);
  } catch (err) {
    console.error('Error en GET /contracts/:id', err);
    res.status(500).json({ error: 'Error al obtener el contrato' });
  }
});

router.put('/:id/odrl-policy', setContractOdrlPolicyController);
router.get('/:id/odrl-policy', getContractOdrlPolicyController);

module.exports = router;
