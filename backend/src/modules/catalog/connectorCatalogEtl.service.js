function safeJsonParse(rawValue) {
  if (!rawValue) return {};
  if (typeof rawValue === 'object') return rawValue;

  try {
    return JSON.parse(rawValue);
  } catch {
    return {};
  }
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value;
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value !== null && value !== undefined && typeof value !== 'string') return value;
  }
  return null;
}

function normalizeTags(rawTags) {
  if (!rawTags) return [];
  if (Array.isArray(rawTags)) {
    return rawTags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(rawTags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeMethods(rawMethods, fallbackMethod = null) {
  const methods = [];

  const pushMethod = (value) => {
    if (!value) return;
    const normalized = String(value).trim().toUpperCase();
    if (normalized && !methods.includes(normalized)) {
      methods.push(normalized);
    }
  };

  if (Array.isArray(rawMethods)) {
    rawMethods.forEach(pushMethod);
  } else if (typeof rawMethods === 'string') {
    rawMethods.split(',').forEach(pushMethod);
  }

  pushMethod(fallbackMethod);

  if (!methods.length) {
    methods.push('GET');
  }

  return methods;
}

function inferStorageType(dataAddress = {}, endpoint) {
  const addressType = String(dataAddress.type || '').toLowerCase();
  if (addressType.includes('http') || /^https?:\/\//i.test(String(endpoint || ''))) {
    return 'EXTERNAL_API';
  }

  return 'FILE';
}

function normalizeConnectorCatalogAsset(rawAsset) {
  const asset = rawAsset || {};
  const properties = asset.properties || asset.asset || asset.metadata || {};
  const dataAddress = asset.dataAddress || asset.data_address || {};
  const endpoint = firstNonEmpty(
    dataAddress.baseUrl,
    dataAddress.endpoint,
    properties.endpoint,
    properties.endpointUrl,
    properties['dcat:endpointURL'],
    properties.href,
    asset.endpoint
  );

  const normalized = {
    externalSystem: 'EDC_CONNECTOR',
    externalId: firstNonEmpty(asset['@id'], asset.id, properties.id, properties.assetId),
    name: firstNonEmpty(properties.name, properties['dct:title'], asset.name),
    description: firstNonEmpty(properties.description, properties['dct:description'], asset.description),
    endpoint,
    storageType: inferStorageType(dataAddress, endpoint),
    tags: normalizeTags(firstNonEmpty(properties.keywords, properties.tags, properties['dcat:keyword'])),
    apiVersion: firstNonEmpty(properties.version, properties.apiVersion, properties['cx-common:version']),
    authType: firstNonEmpty(properties.authType, properties.authScheme, properties['cx-common:authType']),
    contentType: firstNonEmpty(properties.contenttype, properties.contentType, properties['dct:format']),
    methods: normalizeMethods(firstNonEmpty(properties.endpointMethod, properties.methods, properties['cx-common:httpMethod']), dataAddress.method),
    providerName: firstNonEmpty(properties.publisher, properties.providerName, properties['odrl:assigner']),
    connectorProtocol: firstNonEmpty(properties.protocol, properties['edc:protocol'], 'ids-rest'),
    dataAddress,
    rawAsset: asset
  };

  const missingRequired = [];
  if (!normalized.externalId) missingRequired.push('externalId');
  if (!normalized.name) missingRequired.push('name');
  if (normalized.storageType === 'EXTERNAL_API' && !normalized.endpoint) missingRequired.push('endpoint');

  return {
    ...normalized,
    isAcceptable: missingRequired.length === 0,
    missingRequired,
    metadataJson: JSON.stringify({
      sourceType: 'EDC_ASSET',
      assetId: normalized.externalId,
      connectorProtocol: normalized.connectorProtocol,
      contentType: normalized.contentType,
      apiVersion: normalized.apiVersion,
      authType: normalized.authType,
      methods: normalized.methods,
      endpoint: normalized.endpoint,
      tags: normalized.tags,
      providerName: normalized.providerName,
      dataAddress: normalized.dataAddress,
      rawAsset: normalized.rawAsset
    })
  };
}

function buildSelfDescriptionEnrichment(dataset) {
  const externalMetadata = safeJsonParse(dataset?.externalDataset?.metadataJson);
  const assetId = firstNonEmpty(externalMetadata.assetId, externalMetadata.id, dataset?.externalDataset?.externalId);
  const connectorProtocol = firstNonEmpty(externalMetadata.connectorProtocol, externalMetadata.protocol);
  const methods = normalizeMethods(externalMetadata.methods, externalMetadata.dataAddress?.method);

  return {
    assetId,
    sourceSystem: dataset?.externalDataset?.externalSystem || dataset?.origin || null,
    assetType: externalMetadata.sourceType || null,
    connectorProtocol,
    apiVersion: firstNonEmpty(externalMetadata.apiVersion, externalMetadata.version),
    authType: firstNonEmpty(externalMetadata.authType, externalMetadata.authScheme),
    methods,
    contentType: firstNonEmpty(externalMetadata.contentType, externalMetadata.format),
    etlStatus: dataset?.externalDataset ? 'NORMALIZED' : 'LOCAL',
    endpoint: firstNonEmpty(externalMetadata.endpoint, dataset?.storageUri)
  };
}

module.exports = {
  safeJsonParse,
  normalizeConnectorCatalogAsset,
  buildSelfDescriptionEnrichment
};
