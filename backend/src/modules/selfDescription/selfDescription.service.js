const prisma = require('../../config/db');

function splitTags(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

async function buildSelfDescription() {
  const [datasets, contracts, providers, consumers, accessRequests] = await Promise.all([
    prisma.dataset.findMany({
      where: { published: true },
      include: { provider: { select: { id: true, name: true, email: true, orgUnit: true } } }
    }),
    prisma.contract.findMany({
      include: {
        dataset: { select: { id: true, name: true } },
        consumer: { select: { id: true, name: true, email: true, orgUnit: true } },
        provider: { select: { id: true, name: true, email: true, orgUnit: true } }
      }
    }),
    prisma.user.findMany({ where: { role: 'PROVIDER', active: true }, select: { id: true, name: true, email: true, orgUnit: true } }),
    prisma.user.findMany({ where: { role: 'CONSUMER', active: true }, select: { id: true, name: true, email: true, orgUnit: true } }),
    prisma.accessRequest.findMany({ include: { dataset: { select: { id: true, name: true } } } })
  ]);

  const tags = [...new Set(datasets.flatMap((d) => [d.category, ...splitTags(d.tags)].filter(Boolean)))];

  return {
    authority: {
      entityId: process.env.DATASPACE_AUTHORITY_ID || 'inetum-governance-authority',
      name: process.env.DATASPACE_AUTHORITY_NAME || 'Inetum Data Space Governance',
      description: process.env.DATASPACE_AUTHORITY_DESCRIPTION || 'Autoridad de gobierno del Data Space de Inetum',
      responsibilities: ['Gobernanza', 'Cumplimiento de políticas', 'Supervisión operativa'],
      contact: process.env.DATASPACE_AUTHORITY_CONTACT || 'dataspace-governance@inetum.com'
    },
    dataspace: {
      id: process.env.DATASPACE_ID || 'inetum-dataspace',
      name: process.env.DATASPACE_NAME || 'Inetum Corporate Data Space',
      domain: process.env.DATASPACE_DOMAIN || 'corporate',
      owner: process.env.DATASPACE_OWNER || 'Inetum',
      policyGeneral: 'Acceso condicionado a contrato y política ODRL',
      totalResources: datasets.length,
      dataQualityLevel: 'MEDIUM',
      updateFrequency: 'DAILY',
      relatedDataSpaces: []
    },
    tags: tags.map((tag) => ({ id: `tag:${tag.toLowerCase().replace(/\s+/g, '-')}`, name: tag })),
    providers: providers.map((p) => ({
      providerId: p.id,
      role: 'PROVIDER',
      name: p.name,
      contact: p.email,
      domain: p.orgUnit || 'N/A'
    })),
    consumers: consumers.map((c) => ({
      consumerId: c.id,
      name: c.name,
      type: 'INTERNAL',
      contact: c.email,
      domain: c.orgUnit || 'N/A'
    })),
    dataResources: datasets.map((d) => ({
      publicationId: d.id,
      name: d.name,
      providerId: d.providerId,
      description: d.description,
      endpoint: d.storageUri,
      format: d.storageType,
      quality: d.dataClassification,
      createdAt: d.createdAt,
      ownership: d.provider?.name || null
    })),
    odrlPolicies: contracts
      .filter((c) => Boolean(c.odrlPolicy))
      .map((c) => ({
        policyId: c.id,
        name: `contract-${c.id}-policy`,
        description: `Política ODRL del contrato ${c.id}`,
        odrl_json_policy: c.odrlPolicy,
        startDate: c.effectiveFrom,
        endDate: c.effectiveTo
      })),
    contracts: contracts.map((c) => ({
      contractId: c.id,
      resourceId: c.datasetId,
      consumerId: c.consumerId,
      status: c.status,
      sla: null,
      startDate: c.effectiveFrom,
      endDate: c.effectiveTo,
      dataSpaceId: process.env.DATASPACE_ID || 'inetum-dataspace'
    })),
    dataProducts: accessRequests
      .filter((r) => r.dataset)
      .map((r) => ({
        productId: `product-${r.id}`,
        name: r.dataset.name,
        domain: 'N/A',
        size: null,
        sourceResourceId: r.dataset.id
      })),
    qualityMetrics: datasets.map((d) => ({
      resourceId: d.id,
      completeness: null,
      compliance: d.blocked ? 'BLOCKED' : 'ACTIVE',
      correctness: null,
      score: null,
      updatedAt: d.updatedAt
    }))
  };
}

module.exports = {
  buildSelfDescription
};
