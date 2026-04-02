const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeConnectorCatalogAsset,
  buildSelfDescriptionEnrichment
} = require('../src/modules/catalog/connectorCatalogEtl.service');

test('ETL conector: normaliza asset tipo EDC HTTP para APIs', () => {
  const asset = {
    '@id': 'asset-api-001',
    properties: {
      'dct:title': 'Orders API',
      'dct:description': 'API de pedidos',
      'dct:format': 'application/json',
      authType: 'OAuth2',
      version: 'v1',
      methods: ['GET', 'POST'],
      keywords: ['orders', 'sales']
    },
    dataAddress: {
      type: 'HttpData',
      baseUrl: 'https://provider.example.com/orders',
      method: 'GET'
    }
  };

  const result = normalizeConnectorCatalogAsset(asset, 'EDC_ASSET_V1');

  assert.equal(result.isAcceptable, true);
  assert.equal(result.externalSystem, 'EDC_CONNECTOR');
  assert.equal(result.externalId, 'asset-api-001');
  assert.equal(result.storageType, 'EXTERNAL_API');
  assert.equal(result.endpoint, 'https://provider.example.com/orders');
  assert.deepEqual(result.methods, ['GET', 'POST']);
  assert.equal(result.sourceProfile, 'EDC_ASSET_V1');
});

test('ETL conector: rechaza asset HTTP sin id/nombre/endpoint mínimo', () => {
  const result = normalizeConnectorCatalogAsset({
    properties: {},
    dataAddress: { type: 'HttpData' }
  });

  assert.equal(result.isAcceptable, false);
  assert.deepEqual(result.missingRequired.sort(), ['endpoint', 'externalId', 'name']);
});

test('Self-description: enriquece dataset con metadata de asset EDC', () => {
  const result = buildSelfDescriptionEnrichment({
    origin: 'EXTERNAL_OPENMETADATA',
    storageUri: 'https://fallback.example.com/api',
    externalDataset: {
      externalSystem: 'EDC_CONNECTOR',
      externalId: 'asset-55',
      metadataJson: JSON.stringify({
        sourceType: 'EDC_ASSET',
        connectorProtocol: 'dataspace-protocol-http',
        apiVersion: 'v2',
        authType: 'ApiKey',
        methods: ['GET'],
        endpoint: 'https://provider.example.com/api',
        contentType: 'application/json'
      })
    }
  });

  assert.equal(result.assetId, 'asset-55');
  assert.equal(result.sourceProfile, null);
  assert.equal(result.connectorProtocol, 'dataspace-protocol-http');
  assert.equal(result.apiVersion, 'v2');
  assert.equal(result.endpoint, 'https://provider.example.com/api');
  assert.equal(result.etlStatus, 'NORMALIZED');
});


test('ETL conector: normaliza asset con perfil DSSC_MOD_V1', () => {
  const asset = {
    assetId: 'dssc-asset-999',
    assetMetadata: {
      displayName: 'Invoices API',
      summary: 'API de facturas',
      apiVersion: 'v3',
      methods: ['GET', 'PUT'],
      authType: 'OAuth2'
    },
    access: {
      type: 'HttpData',
      endpoint: 'https://dssc.example.com/invoices',
      method: 'GET'
    }
  };

  const result = normalizeConnectorCatalogAsset(asset, 'DSSC_MOD_V1');

  assert.equal(result.isAcceptable, true);
  assert.equal(result.externalSystem, 'DSSC_CONNECTOR');
  assert.equal(result.externalId, 'dssc-asset-999');
  assert.equal(result.sourceProfile, 'DSSC_MOD_V1');
  assert.deepEqual(result.methods, ['GET', 'PUT']);
});
