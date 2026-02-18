const prisma = require('../../config/db');

/**
 * Lista de datasets externos (por ejemplo, sincronizados desde OpenMetadata).
 */
async function listExternalDatasets() {
  return prisma.externalDataset.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Crea o actualiza un ExternalDataset.
 * Esta función es la que usarías cuando "sincronizas" desde OpenMetadata.
 */
async function upsertExternalDataset({
  externalSystem,
  externalId,
  name,
  description,
  metadataJson
}) {
  const existing = await prisma.externalDataset.findFirst({
    where: {
      externalSystem,
      externalId
    }
  });

  if (existing) {
    return prisma.externalDataset.update({
      where: { id: existing.id },
      data: {
        name,
        description,
        metadataJson
      }
    });
  }

  return prisma.externalDataset.create({
    data: {
      externalSystem,
      externalId,
      name,
      description,
      metadataJson
    }
  });
}

/**
 * Hook de sincronización "falso" (placeholder).
 * Aquí en un futuro integrarás la llamada real a OpenMetadata.
 */
async function syncFromOpenMetadata(mockDataArray) {
  // mockDataArray podría ser una lista de objetos con info que obtengas de OpenMetadata.
  for (const d of mockDataArray) {
    await upsertExternalDataset({
      externalSystem: 'OPENMETADATA',
      externalId: d.id,
      name: d.name,
      description: d.description,
      metadataJson: JSON.stringify(d.metadata || {})
    });
  }

  return listExternalDatasets();
}

module.exports = {
  listExternalDatasets,
  upsertExternalDataset,
  syncFromOpenMetadata
};