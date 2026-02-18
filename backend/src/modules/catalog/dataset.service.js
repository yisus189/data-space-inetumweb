const prisma = require('../../config/db');

/**
 * Crea un dataset propiedad de un provider.
 */
async function createDataset(providerId, data) {
  const {
    name,
    description,
    category,
    tags,
    origin,
    storageType,
    storageUri,
    published,
    legalBasis,
    dataClassification,
    usageTerms,
    externalDatasetId
  } = data;

  // Validaciones básicas
  if (!name) {
    const err = new Error('El nombre del dataset es obligatorio');
    err.status = 400;
    throw err;
  }

  const dataset = await prisma.dataset.create({
    data: {
      name,
      description,
      category,
      tags,
      origin: origin || 'INTERNAL',
      storageType: storageType || 'FILE',
      storageUri,
      published: !!published,
      legalBasis,
      dataClassification: dataClassification || 'INTERNAL',
      usageTerms,
      providerId,
      externalDatasetId: externalDatasetId || null
    }
  });

  return dataset;
}

/**
 * Actualiza un dataset, comprobando que el provider es el dueño.
 */
async function updateDataset(providerId, datasetId, data) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId }
  });

  if (!dataset) {
    const err = new Error('Dataset no encontrado');
    err.status = 404;
    throw err;
  }

  if (dataset.providerId !== providerId) {
    const err = new Error('No puedes modificar un dataset que no te pertenece');
    err.status = 403;
    throw err;
  }

  const updated = await prisma.dataset.update({
    where: { id: datasetId },
    data: {
      name: data.name ?? dataset.name,
      description: data.description ?? dataset.description,
      category: data.category ?? dataset.category,
      tags: data.tags ?? dataset.tags,
      origin: data.origin ?? dataset.origin,
      storageType: data.storageType ?? dataset.storageType,
      storageUri: data.storageUri ?? dataset.storageUri,
      legalBasis: data.legalBasis ?? dataset.legalBasis,
      dataClassification: data.dataClassification ?? dataset.dataClassification,
      usageTerms: data.usageTerms ?? dataset.usageTerms,
      externalDatasetId:
        typeof data.externalDatasetId === 'number'
          ? data.externalDatasetId
          : dataset.externalDatasetId
    }
  });

  return updated;
}

/**
 * Cambia flag de publicación del dataset.
 */
async function setDatasetPublished(providerId, datasetId, published) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId }
  });

  if (!dataset) {
    const err = new Error('Dataset no encontrado');
    err.status = 404;
    throw err;
  }

  if (dataset.providerId !== providerId) {
    const err = new Error('No puedes publicar/unpublicar un dataset que no te pertenece');
    err.status = 403;
    throw err;
  }

  const updated = await prisma.dataset.update({
    where: { id: datasetId },
    data: { published: !!published }
  });

  return updated;
}

/**
 * Devuelve datasets del provider autenticado.
 */
async function listProviderDatasets(providerId) {
  return prisma.dataset.findMany({
    where: { providerId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Devuelve datasets publicados (catálogo para consumers).
 * Se puede filtrar por categoría, texto, etc.
 */
async function listPublishedDatasets(filters = {}) {
  const { search, category, providerId } = filters;

  return prisma.dataset.findMany({
    where: {
      published: true,
      ...(category && { category }),
      ...(providerId && { providerId: Number(providerId) }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } }
        ]
      })
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      externalDataset: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Detalle de un dataset (para consumer o provider).
 * Si no está publicado, solo el provider dueño lo puede ver (esto lo controlará el controlador).
 */
async function getDatasetById(datasetId) {
  return prisma.dataset.findUnique({
    where: { id: datasetId },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      externalDataset: true
    }
  });
}

module.exports = {
  createDataset,
  updateDataset,
  setDatasetPublished,
  listProviderDatasets,
  listPublishedDatasets,
  getDatasetById
};