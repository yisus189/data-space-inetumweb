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

function normalizeWithEdcAssetProfile(rawAsset) {
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

  return {
    sourceProfile: 'EDC_ASSET_V1',
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
    connectorProtocol: firstNonEmpty(properties.protocol, properties['edc:protocol'], 'dataspace-protocol-http'),
    transferModes: normalizeMethods(firstNonEmpty(properties.transferModes, properties['dct:type']), 'API_PULL'),
    dataAddress,
    rawAsset: asset
  };
}

function normalizeWithDsscModProfile(rawAsset) {
  const asset = rawAsset || {};
  const metadata = asset.assetMetadata || asset.metadata || {};
  const access = asset.access || asset.dataPlane || {};
  const endpoint = firstNonEmpty(access.endpoint, access.baseUrl, metadata.endpoint, metadata.url, asset.endpoint);

  return {
    sourceProfile: 'DSSC_MOD_V1',
    externalSystem: 'DSSC_CONNECTOR',
    externalId: firstNonEmpty(asset.assetId, asset.id, metadata.assetId, metadata.id),
    name: firstNonEmpty(metadata.displayName, metadata.name, asset.name),
    description: firstNonEmpty(metadata.summary, metadata.description, asset.description),
    endpoint,
    storageType: inferStorageType({ type: access.type || 'HttpData' }, endpoint),
    tags: normalizeTags(firstNonEmpty(metadata.labels, metadata.tags, asset.tags)),
    apiVersion: firstNonEmpty(metadata.apiVersion, metadata.version),
    authType: firstNonEmpty(access.authType, metadata.authType, 'Bearer'),
    contentType: firstNonEmpty(access.contentType, metadata.contentType, 'application/json'),
    methods: normalizeMethods(firstNonEmpty(access.methods, metadata.methods), access.method),
    providerName: firstNonEmpty(metadata.providerName, metadata.publisher),
    connectorProtocol: firstNonEmpty(asset.protocol, metadata.protocol, 'dssc-protocol-http'),
    transferModes: normalizeMethods(firstNonEmpty(asset.transferModes, metadata.transferModes), 'API_PULL'),
    dataAddress: access,
    rawAsset: asset
  };
}

function normalizeConnectorCatalogAsset(rawAsset, profile = 'EDC_ASSET_V1') {
  const normalizedBase = String(profile).toUpperCase() === 'DSSC_MOD_V1'
    ? normalizeWithDsscModProfile(rawAsset)
    : normalizeWithEdcAssetProfile(rawAsset);

  const missingRequired = [];
  if (!normalizedBase.externalId) missingRequired.push('externalId');
  if (!normalizedBase.name) missingRequired.push('name');
  if (normalizedBase.storageType === 'EXTERNAL_API' && !normalizedBase.endpoint) missingRequired.push('endpoint');

  return {
    ...normalizedBase,
    isAcceptable: missingRequired.length === 0,
    missingRequired,
    metadataJson: JSON.stringify({
      sourceType: 'CONNECTOR_ASSET',
      sourceProfile: normalizedBase.sourceProfile,
      assetId: normalizedBase.externalId,
      connectorProtocol: normalizedBase.connectorProtocol,
      contentType: normalizedBase.contentType,
      apiVersion: normalizedBase.apiVersion,
      authType: normalizedBase.authType,
      methods: normalizedBase.methods,
      transferModes: normalizedBase.transferModes,
      endpoint: normalizedBase.endpoint,
      tags: normalizedBase.tags,
      providerName: normalizedBase.providerName,
      dataAddress: normalizedBase.dataAddress,
      rawAsset: normalizedBase.rawAsset
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
    sourceProfile: externalMetadata.sourceProfile || null,
    sourceSystem: dataset?.externalDataset?.externalSystem || dataset?.origin || null,
    assetType: externalMetadata.sourceType || null,
    connectorProtocol,
    apiVersion: firstNonEmpty(externalMetadata.apiVersion, externalMetadata.version),
    authType: firstNonEmpty(externalMetadata.authType, externalMetadata.authScheme),
    methods,
    transferModes: normalizeMethods(externalMetadata.transferModes, null),
    contentType: firstNonEmpty(externalMetadata.contentType, externalMetadata.format),
    etlStatus: dataset?.externalDataset ? 'NORMALIZED' : 'LOCAL',
    endpoint: firstNonEmpty(externalMetadata.endpoint, dataset?.storageUri)
  };
}

function exportDatasetAsConnectorAsset(dataset, profile = 'EDC_ASSET_V1') {
  const normalizedProfile = String(profile).toUpperCase();
  const common = {
    id: `dataset-${dataset.id}`,
    name: dataset.name,
    description: dataset.description || '',
    endpoint: dataset.storageUri,
    methods: ['GET'],
    contentType: 'application/json',
    version: 'v1',
    tags: normalizeTags(dataset.tags),
    providerName: dataset.provider?.name || null,
    protocol: normalizedProfile === 'DSSC_MOD_V1' ? 'dssc-protocol-http' : 'dataspace-protocol-http'
  };

  if (normalizedProfile === 'DSSC_MOD_V1') {
    return {
      assetId: common.id,
      protocol: common.protocol,
      assetMetadata: {
        assetId: common.id,
        displayName: common.name,
        summary: common.description,
        tags: common.tags,
        apiVersion: common.version,
        providerName: common.providerName,
        contentType: common.contentType,
        methods: common.methods
      },
      access: {
        type: 'HttpData',
        endpoint: common.endpoint,
        method: 'GET',
        methods: common.methods,
        authType: 'Bearer',
        contentType: common.contentType
      },
      transferModes: ['API_PULL', 'CONNECTOR_PROXY']
    };
  }

  return {
    '@id': common.id,
    properties: {
      'dct:title': common.name,
      'dct:description': common.description,
      'dct:format': common.contentType,
      version: common.version,
      keywords: common.tags,
      publisher: common.providerName,
      protocol: common.protocol,
      methods: common.methods,
      transferModes: ['API_PULL', 'CONNECTOR_PROXY']
    },
    dataAddress: {
      type: 'HttpData',
      baseUrl: common.endpoint,
      method: 'GET'
    }
  };
}

module.exports = {
  safeJsonParse,
  normalizeConnectorCatalogAsset,
  buildSelfDescriptionEnrichment,
  exportDatasetAsConnectorAsset
};
