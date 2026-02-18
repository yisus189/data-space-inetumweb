const prisma = require('../../config/db');

/**
 * Provider: ver accesos a sus datasets.
 */
async function listAccessLogsForProvider(providerId, filters = {}) {
  const { datasetId, from, to } = filters;

  const whereClause = {
    dataset: { providerId }
  };

  if (datasetId) {
    whereClause.datasetId = Number(datasetId);
  }

  if (from || to) {
    whereClause.timestamp = {};
    if (from) whereClause.timestamp.gte = new Date(from);
    if (to) whereClause.timestamp.lte = new Date(to);
  }

  return prisma.accessLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, email: true }
      },
      dataset: {
        select: { id: true, name: true }
      },
      contract: {
        select: {
          id: true,
          status: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  });
}

/**
 * Operator: ver todos los accesos.
 */
async function listAccessLogsGlobal(filters = {}) {
  const { userId, datasetId, from, to } = filters;

  const whereClause = {};

  if (userId) whereClause.userId = Number(userId);
  if (datasetId) whereClause.datasetId = Number(datasetId);

  if (from || to) {
    whereClause.timestamp = {};
    if (from) whereClause.timestamp.gte = new Date(from);
    if (to) whereClause.timestamp.lte = new Date(to);
  }

  return prisma.accessLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, email: true, role: true }
      },
      dataset: {
        select: { id: true, name: true, providerId: true }
      },
      contract: {
        select: {
          id: true,
          status: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  });
}

/**
 * Consumer: ver sus propios accesos (opcional).
 */
async function listMyAccessLogs(consumerId, filters = {}) {
  const { datasetId, from, to } = filters;

  const whereClause = {
    userId: consumerId
  };

  if (datasetId) {
    whereClause.datasetId = Number(datasetId);
  }

  if (from || to) {
    whereClause.timestamp = {};
    if (from) whereClause.timestamp.gte = new Date(from);
    if (to) whereClause.timestamp.lte = new Date(to);
  }

  return prisma.accessLog.findMany({
    where: whereClause,
    include: {
      dataset: {
        select: { id: true, name: true }
      },
      contract: {
        select: { id: true, status: true }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  });
}

module.exports = {
  listAccessLogsForProvider,
  listAccessLogsGlobal,
  listMyAccessLogs
};