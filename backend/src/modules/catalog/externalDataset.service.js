const prisma = require('../../config/db');
const { normalizeConnectorCatalogAsset, exportDatasetAsConnectorAsset } = require('./connectorCatalogEtl.service');

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


async function syncFromConnectorCatalog(assetArray, profile = 'EDC_ASSET_V1') {
  const accepted = [];
  const rejected = [];

  for (const asset of assetArray) {
    const normalized = normalizeConnectorCatalogAsset(asset, profile);

    if (!normalized.isAcceptable) {
      rejected.push({
        externalId: normalized.externalId || null,
        missingRequired: normalized.missingRequired
      });
      continue;
    }

    const saved = await upsertExternalDataset({
      externalSystem: normalized.externalSystem,
      externalId: normalized.externalId,
      name: normalized.name,
      description: normalized.description,
      metadataJson: normalized.metadataJson
    });

    accepted.push(saved);
  }

  return {
    accepted,
    rejected,
    total: assetArray.length
  };
}


async function exportConnectorAssets({ profile = 'EDC_ASSET_V1', publishedOnly = true } = {}) {
  const datasets = await prisma.dataset.findMany({
    where: publishedOnly ? { published: true } : undefined,
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const assets = datasets
    .filter((dataset) => dataset.storageType === 'EXTERNAL_API' && dataset.storageUri)
    .map((dataset) => exportDatasetAsConnectorAsset(dataset, profile));

  return {
    profile: String(profile).toUpperCase(),
    exported: assets.length,
    assets
  };
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
  syncFromOpenMetadata,
  syncFromConnectorCatalog,
  exportConnectorAssets
};