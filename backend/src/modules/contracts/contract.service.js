const prisma = require('../../config/db');
const { revokeContractInConnector } = require('../connectors/dssc-connector.service');

/**
 * Lista contratos de un consumer.
 */
async function listMyContractsAsConsumer(consumerId) {
  return prisma.contract.findMany({
    where: { consumerId },
    include: {
      dataset: {
        select: { id: true, name: true }
      },
      provider: {
        select: { id: true, name: true, email: true }
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
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Lista contratos donde soy provider.
 */
async function listMyContractsAsProvider(providerId) {
  return prisma.contract.findMany({
    where: { providerId },
    include: {
      dataset: {
        select: { id: true, name: true }
      },
      consumer: {
        select: { id: true, name: true, email: true, orgUnit: true }
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
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Revocar contrato (por provider u operator).
 */
async function revokeContract(contractId) {
  const existing = await prisma.contract.findUnique({
    where: { id: contractId }
  });

  if (!existing) {
    const err = new Error('Contrato no encontrado');
    err.status = 404;
    throw err;
  }

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: { status: 'REVOKED' }
  });

  try {
    await revokeContractInConnector(updated);
  } catch (connectorError) {
    console.error('Error revocando contrato en conector DSSC:', connectorError.message);
  }

  return updated;
}

module.exports = {
  listMyContractsAsConsumer,
  listMyContractsAsProvider,
  revokeContract
};