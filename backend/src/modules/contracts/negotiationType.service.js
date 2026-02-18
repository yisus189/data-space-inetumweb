const prisma = require('../../config/db');

async function listNegotiationTypes() {
  return prisma.negotiationType.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

async function createNegotiationType(data) {
  const { name, description, defaultContractTemplate } = data;

  if (!name || !defaultContractTemplate) {
    const err = new Error('name y defaultContractTemplate son obligatorios');
    err.status = 400;
    throw err;
  }

  return prisma.negotiationType.create({
    data: {
      name,
      description,
      defaultContractTemplate
    }
  });
}

async function updateNegotiationType(id, data) {
  const existing = await prisma.negotiationType.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('NegotiationType no encontrado');
    err.status = 404;
    throw err;
  }

  return prisma.negotiationType.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      defaultContractTemplate:
        data.defaultContractTemplate ?? existing.defaultContractTemplate
    }
  });
}

async function deleteNegotiationType(id) {
  // Opcionalmente podrías comprobar si está en uso
  return prisma.negotiationType.delete({
    where: { id }
  });
}

module.exports = {
  listNegotiationTypes,
  createNegotiationType,
  updateNegotiationType,
  deleteNegotiationType
};