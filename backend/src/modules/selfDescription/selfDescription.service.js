const prisma = require('../../config/db');
const { buildSelfDescriptionEnrichment } = require('../catalog/connectorCatalogEtl.service');

const REQUIRED_OPTIONAL_PROFILE = {
  providers: {
    required: ['providerId', 'name', 'contact', 'domain'],
    optional: ['role', 'type', 'function']
  },
  consumers: {
    required: ['consumerId', 'name', 'contact', 'type'],
    optional: ['domain']
  },
  dataResources: {
    required: ['publicationId', 'name', 'providerId', 'format', 'createdAt'],
    optional: ['description', 'endpoint', 'quality', 'ownership', 'sourceSystem', 'assetId', 'assetType', 'connectorProtocol', 'apiVersion', 'authType', 'methods', 'contentType', 'etlStatus']
  },
  contracts: {
    required: ['contractId', 'resourceId', 'consumerId', 'status', 'startDate', 'dataSpaceId'],
    optional: ['sla', 'endDate']
  },
  odrlPolicies: {
    required: ['policyId', 'name', 'odrl_json_policy', 'startDate'],
    optional: ['description', 'endDate']
  },
  dataProducts: {
    required: ['productId', 'name', 'sourceResourceId'],
    optional: ['domain', 'size']
  },
  qualityMetrics: {
    required: ['resourceId', 'compliance', 'updatedAt'],
    optional: ['completeness', 'correctness', 'score']
  }
};

function splitTags(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function validateEntityFields(entity, requiredFields = [], optionalFields = []) {
  const missingRequired = requiredFields.filter((field) => !hasValue(entity[field]));
  const missingOptional = optionalFields.filter((field) => !hasValue(entity[field]));

  return {
    isAccepted: missingRequired.length === 0,
    missingRequired,
    missingOptional
  };
}

function applyAcceptanceGate(entityName, entities, profile, idField) {
  const accepted = [];
  const rejected = [];

  for (const entity of entities) {
    const check = validateEntityFields(entity, profile.required, profile.optional);
    if (check.isAccepted) {
      accepted.push(entity);
      continue;
    }

    rejected.push({
      entityType: entityName,
      id: entity[idField] || null,
      missingRequired: check.missingRequired,
      missingOptional: check.missingOptional
    });
  }

  return {
    accepted,
    rejected,
    stats: {
      total: entities.length,
      accepted: accepted.length,
      rejected: rejected.length
    }
  };
}

async function buildSelfDescription() {
  const [datasets, contracts, providers, consumers, accessRequests] = await Promise.all([
    prisma.dataset.findMany({
      where: { published: true },
      include: { provider: { select: { id: true, name: true, email: true, orgUnit: true } }, externalDataset: true }
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

  const providerEntries = providers.map((p) => ({
    providerId: p.id,
    role: 'PROVIDER',
    type: 'INTERNAL_PROVIDER',
    name: p.name,
    contact: p.email,
    domain: p.orgUnit || 'N/A',
    function: p.orgUnit || null
  }));

  const consumerEntries = consumers.map((c) => ({
    consumerId: c.id,
    name: c.name,
    type: 'INTERNAL',
    contact: c.email,
    domain: c.orgUnit || 'N/A'
  }));

  const dataResourceEntries = datasets.map((d) => {
    const enrichment = buildSelfDescriptionEnrichment(d);

    return {
      publicationId: d.id,
      name: d.name,
      providerId: d.providerId,
      description: d.description,
      endpoint: enrichment.endpoint || d.storageUri,
      format: d.storageType,
      quality: d.dataClassification,
      createdAt: d.createdAt,
      ownership: d.provider?.name || null,
      sourceSystem: enrichment.sourceSystem,
      assetId: enrichment.assetId,
      assetType: enrichment.assetType,
      connectorProtocol: enrichment.connectorProtocol,
      apiVersion: enrichment.apiVersion,
      authType: enrichment.authType,
      methods: enrichment.methods,
      contentType: enrichment.contentType,
      etlStatus: enrichment.etlStatus
    };
  });

  const odrlPolicyEntries = contracts
    .filter((c) => Boolean(c.odrlPolicy))
    .map((c) => ({
      policyId: c.id,
      name: `contract-${c.id}-policy`,
      description: `Política ODRL del contrato ${c.id}`,
      odrl_json_policy: c.odrlPolicy,
      startDate: c.effectiveFrom,
      endDate: c.effectiveTo
    }));

  const contractEntries = contracts.map((c) => ({
    contractId: c.id,
    resourceId: c.datasetId,
    consumerId: c.consumerId,
    status: c.status,
    sla: null,
    startDate: c.effectiveFrom,
    endDate: c.effectiveTo,
    dataSpaceId: process.env.DATASPACE_ID || 'inetum-dataspace'
  }));

  const dataProductEntries = accessRequests
    .filter((r) => r.dataset)
    .map((r) => ({
      productId: `product-${r.id}`,
      name: r.dataset.name,
      domain: 'N/A',
      size: null,
      sourceResourceId: r.dataset.id
    }));

  const qualityMetricEntries = datasets.map((d) => ({
    resourceId: d.id,
    completeness: null,
    compliance: d.blocked ? 'BLOCKED' : 'ACTIVE',
    correctness: null,
    score: null,
    updatedAt: d.updatedAt
  }));

  const providerGate = applyAcceptanceGate('providers', providerEntries, REQUIRED_OPTIONAL_PROFILE.providers, 'providerId');
  const consumerGate = applyAcceptanceGate('consumers', consumerEntries, REQUIRED_OPTIONAL_PROFILE.consumers, 'consumerId');
  const resourceGate = applyAcceptanceGate('dataResources', dataResourceEntries, REQUIRED_OPTIONAL_PROFILE.dataResources, 'publicationId');
  const odrlGate = applyAcceptanceGate('odrlPolicies', odrlPolicyEntries, REQUIRED_OPTIONAL_PROFILE.odrlPolicies, 'policyId');
  const contractGate = applyAcceptanceGate('contracts', contractEntries, REQUIRED_OPTIONAL_PROFILE.contracts, 'contractId');
  const productGate = applyAcceptanceGate('dataProducts', dataProductEntries, REQUIRED_OPTIONAL_PROFILE.dataProducts, 'productId');
  const qualityGate = applyAcceptanceGate('qualityMetrics', qualityMetricEntries, REQUIRED_OPTIONAL_PROFILE.qualityMetrics, 'resourceId');

  const resourcePolicyLinks = contracts
    .filter((c) => Boolean(c.odrlPolicy))
    .map((c) => ({
      resourceId: c.datasetId,
      policyId: c.id,
      assignedAt: c.createdAt
    }));

  const publicationProductLinks = accessRequests
    .filter((r) => r.dataset)
    .map((r) => ({
      publicationId: r.dataset.id,
      productId: `product-${r.id}`,
      size: null
    }));

  return {
    version: '2.2.0',
    issuedAt: new Date().toISOString(),
    profile: 'dssc-self-description',
    validationPolicy: {
      gate: 'REQUIRED_FIELDS_MANDATORY',
      description: 'Si faltan campos requeridos, la entidad no se acepta en el self-description publicado.',
      fieldProfile: REQUIRED_OPTIONAL_PROFILE,
      summary: {
        providers: providerGate.stats,
        consumers: consumerGate.stats,
        dataResources: resourceGate.stats,
        odrlPolicies: odrlGate.stats,
        contracts: contractGate.stats,
        dataProducts: productGate.stats,
        qualityMetrics: qualityGate.stats
      },
      rejectedEntities: [
        ...providerGate.rejected,
        ...consumerGate.rejected,
        ...resourceGate.rejected,
        ...odrlGate.rejected,
        ...contractGate.rejected,
        ...productGate.rejected,
        ...qualityGate.rejected
      ]
    },
    authority: {
      entityId: process.env.DATASPACE_AUTHORITY_ID || 'inetum-governance-authority',
      name: process.env.DATASPACE_AUTHORITY_NAME || 'Inetum Data Space Governance',
      description: process.env.DATASPACE_AUTHORITY_DESCRIPTION || 'Autoridad de gobierno del Data Space de Inetum',
      type: 'GovernanceAuthority',
      responsibilities: ['Gobernanza', 'Cumplimiento de políticas', 'Supervisión operativa'],
      contact: process.env.DATASPACE_AUTHORITY_CONTACT || 'dataspace-governance@inetum.com'
    },
    dataspace: {
      id: process.env.DATASPACE_ID || 'inetum-dataspace',
      name: process.env.DATASPACE_NAME || 'Inetum Corporate Data Space',
      domain: process.env.DATASPACE_DOMAIN || 'corporate',
      owner: process.env.DATASPACE_OWNER || 'Inetum',
      policyGeneral: 'Acceso condicionado a contrato y política ODRL',
      totalResources: resourceGate.accepted.length,
      dataQualityLevel: 'MEDIUM',
      updateFrequency: 'DAILY',
      relatedDataSpaces: []
    },
    tags: tags.map((tag) => ({ id: `tag:${tag.toLowerCase().replace(/\s+/g, '-')}`, name: tag, createdAt: new Date().toISOString() })),
    providers: providerGate.accepted,
    consumers: consumerGate.accepted,
    dataResources: resourceGate.accepted,
    odrlPolicies: odrlGate.accepted,
    resourcePolicyLinks,
    contracts: contractGate.accepted,
    dataProducts: productGate.accepted,
    publicationProductLinks,
    qualityMetrics: qualityGate.accepted,
    etl: {
      readiness: 'CONNECTOR_EDC_COMPATIBLE',
      supportedCatalogSources: ['OPENMETADATA', 'EDC_CONNECTOR'],
      normalizationProfiles: ['OPENMETADATA_BASIC', 'EDC_ASSET_V1'],
      acceptedExternalResources: resourceGate.accepted.filter((r) => r.sourceSystem && r.sourceSystem !== 'INTERNAL').length
    },
    capabilities: {
      connectorMode: process.env.DATASPACE_CONNECTOR_MODE || 'LOCAL_ENFORCEMENT',
      controlPlane: {
        catalogImport: true,
        contractSync: true,
        contractRevocation: true,
        idempotencyKeys: true
      },
      dataPlane: {
        apiAssetIngestion: true,
        mediatedAccess: true,
        supportedExchangeModes: ['FILE', 'EXTERNAL_API'],
        tokenizedAccess: true
      },
      supportedExchangeModes: ['FILE', 'EXTERNAL_API'],
      resilience: {
        timeoutMs: Number(process.env.DSSC_CONNECTOR_TIMEOUT_MS || 5000),
        retryMax: Number(process.env.DSSC_CONNECTOR_RETRY_MAX || 2),
        circuitBreakerThreshold: Number(process.env.DSSC_CONNECTOR_CIRCUIT_BREAKER_THRESHOLD || 5),
        circuitBreakerCooldownMs: Number(process.env.DSSC_CONNECTOR_CIRCUIT_BREAKER_COOLDOWN_MS || 30000)
      },
      policyEnforcement: {
        engine: 'ODRL_MVP_PLUS',
        supportedLeftOperands: ['purpose', 'dateTime', 'assignee', 'assigner', 'target'],
        supportedOperators: ['eq', 'neq', 'isAnyOf', 'gteq', 'gt', 'after', 'lteq', 'lt', 'before']
      }
    },
    security: {
      auth: 'JWT',
      jwtIssuer: process.env.JWT_ISSUER || 'inetum-dataspace',
      jwtAudience: process.env.JWT_AUDIENCE || 'inetum-dataspace-api',
      jwtAlgorithm: (process.env.JWT_ALGORITHM || 'HS256').toUpperCase(),
      jwksEndpoint: '/auth/.well-known/jwks.json',
      tokenMetadataEndpoint: '/auth/token-metadata',
      queryTokenEnabled: process.env.ALLOW_QUERY_TOKEN === 'true',
      tlsRequired: process.env.TLS_REQUIRED === 'true',
      trustFramework: {
        mtlsEnabled: process.env.DSSC_CONNECTOR_MTLS_ENABLED === 'true',
        connectorStatusEndpoint: '/connector/status',
        requestIdHeader: 'X-Request-Id',
        requiresRs256InProduction: true
      }
    }
  };
}

module.exports = {
  buildSelfDescription,
  validateEntityFields,
  applyAcceptanceGate
};
