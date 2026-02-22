// backend/src/modules/contracts/contract.controller.js
const service = require('./contract.service');
const prisma = require('../../config/db');

async function listMyContractsAsConsumerController(req, res, next) {
  try {
    const consumerId = req.user.id;
    const list = await service.listMyContractsAsConsumer(consumerId);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function listContractsController(req, res, next) {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        dataset: true,
        provider: true,
        consumer: true,
      },
    });
    res.json(contracts);
  } catch (err) {
    next(err);
  }
}

async function getContractByIdController(req, res, next) {
  try {
    const id = Number(req.params.id);
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        dataset: true,
        provider: true,
        consumer: true,
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    res.json(contract);
  } catch (err) {
    next(err);
  }
}

async function listMyContractsAsProviderController(req, res, next) {
  try {
    const providerId = req.user.id;
    const list = await service.listMyContractsAsProvider(providerId);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function revokeContractController(req, res, next) {
  try {
    const contractId = parseInt(req.params.id, 10);
    const updated = await service.revokeContract(contractId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /contracts/:id/odrl-policy
 * Establecer o actualizar la política ODRL de un contrato.
 * Solo el PROVIDER propietario del contrato o un OPERATOR pueden hacerlo.
 */
async function setContractOdrlPolicyController(req, res, next) {
  try {
    const contractId = Number(req.params.id);
    const policy = req.body; // JSON-LD completo

    // Obtenemos el contrato para verificar permisos
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, providerId: true },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    // Si no es OPERATOR, comprobamos que sea el provider propietario
    if (
      req.user.role !== 'OPERATOR' &&
      contract.providerId !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: 'No tienes permisos para modificar esta política' });
    }

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: { odrlPolicy: policy },
      select: {
        id: true,
        odrlPolicy: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /contracts/:id/odrl-policy
 * Devuelve la política ODRL asociada a un contrato (o null si no existe).
 * Provider, Consumer y Operator pueden verla.
 */
async function getContractOdrlPolicyController(req, res, next) {
  try {
    const contractId = Number(req.params.id);

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        providerId: true,
        consumerId: true,
        odrlPolicy: true,
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    // Verificación básica: provider, consumer u operator
    if (
      req.user.role !== 'OPERATOR' &&
      contract.providerId !== req.user.id &&
      contract.consumerId !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: 'No tienes permisos para ver esta política' });
    }

    res.json(contract.odrlPolicy || null);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMyContractsAsConsumerController,
  listContractsController,
  getContractByIdController,
  listMyContractsAsProviderController,
  revokeContractController,
  setContractOdrlPolicyController,
  getContractOdrlPolicyController,
};