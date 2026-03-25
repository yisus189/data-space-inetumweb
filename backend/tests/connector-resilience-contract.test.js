const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

function loadConnectorService(env = {}) {
  const connectorEnvKeys = [
    'DATASPACE_CONNECTOR_MODE',
    'DSSC_CONNECTOR_BASE_URL',
    'DSSC_CONNECTOR_TIMEOUT_MS',
    'DSSC_CONNECTOR_RETRY_MAX',
    'DSSC_CONNECTOR_RETRY_BASE_MS',
    'DSSC_CONNECTOR_CIRCUIT_BREAKER_THRESHOLD',
    'DSSC_CONNECTOR_CIRCUIT_BREAKER_COOLDOWN_MS',
    'DSSC_CONNECTOR_PENDING_MAX',
    'DSSC_CONNECTOR_PROFILE',
    'DSSC_CONNECTOR_SYNC_PATH',
    'DSSC_CONNECTOR_REVOKE_PATH',
    'DSSC_CONNECTOR_ACCESS_PATH',
    'DSSC_CONNECTOR_HEALTH_PATH',
    'DSSC_CONNECTOR_API_KEY',
    'DSSC_CONNECTOR_AUTH_MODE',
    'DSSC_CONNECTOR_AUTH_HEADER',
    'DSSC_CONNECTOR_AUTH_PREFIX',
    'DSSC_CONNECTOR_MTLS_ENABLED',
    'DSSC_CONNECTOR_MTLS_CERT_PATH',
    'DSSC_CONNECTOR_MTLS_KEY_PATH',
    'DSSC_CONNECTOR_MTLS_CA_PATH'
  ];

  for (const key of connectorEnvKeys) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(env)) {
    process.env[key] = String(value);
  }

  const servicePath = require.resolve('../src/modules/connectors/dssc-connector.service');
  delete require.cache[servicePath];

  return require('../src/modules/connectors/dssc-connector.service');
}

test('Fase 3 interfaz: valida payload de contrato antes de sync', async () => {
  const { syncContractToConnector } = loadConnectorService({
    DATASPACE_CONNECTOR_MODE: 'DSSC_HTTP',
    DSSC_CONNECTOR_BASE_URL: 'http://localhost:9999'
  });

  await assert.rejects(
    () => syncContractToConnector({ id: 1 }),
    (error) => error.code === 'INVALID_CONNECTOR_CONTRACT_PAYLOAD'
  );
});

test('Fase 3 interfaz: valida payload de data plane antes de invocar conector', async () => {
  const { requestDataPlaneAccess } = loadConnectorService({
    DATASPACE_CONNECTOR_MODE: 'DSSC_HTTP',
    DSSC_CONNECTOR_BASE_URL: 'http://localhost:9999'
  });

  await assert.rejects(
    () => requestDataPlaneAccess({ dataset: { id: 7 }, contract: { id: 3 }, consumerId: 9, action: 'use' }),
    (error) => error.code === 'INVALID_CONNECTOR_DATASET_PAYLOAD'
  );
});

test('Fase 3 resiliencia: status refleja circuit breaker en modo local', async () => {
  const { getConnectorStatus } = loadConnectorService({
    DATASPACE_CONNECTOR_MODE: 'LOCAL_ENFORCEMENT'
  });

  const status = await getConnectorStatus();

  assert.equal(status.healthy, true);
  assert.equal(status.mode, 'LOCAL_ENFORCEMENT');
  assert.equal(status.circuitBreaker.open, false);
});


test('Fase 3 interfaz: rechaza acciones no soportadas por el adapter', async () => {
  const { requestDataPlaneAccess } = loadConnectorService({
    DATASPACE_CONNECTOR_MODE: 'DSSC_HTTP',
    DSSC_CONNECTOR_BASE_URL: 'http://localhost:9999'
  });

  await assert.rejects(
    () =>
      requestDataPlaneAccess({
        dataset: { id: 7, storageUri: 'https://example.org/data' },
        contract: { id: 3 },
        consumerId: 9,
        action: 'delete'
      }),
    (error) => error.code === 'UNSUPPORTED_CONNECTOR_ACTION'
  );
});

test('Fase 3 interfaz: local enforcement devuelve adapterMeta versionado', async () => {
  const { requestDataPlaneAccess } = loadConnectorService({
    DATASPACE_CONNECTOR_MODE: 'LOCAL_ENFORCEMENT'
  });

  const result = await requestDataPlaneAccess({
    dataset: { id: 7, storageUri: 'https://example.org/data' },
    contract: { id: 3 },
    consumerId: 9,
    action: 'download'
  });

  assert.equal(result.adapterMeta.contractVersion, '1.0');
  assert.equal(result.adapterMeta.operation, 'data-plane.access.request');
});


test('Fase 3 resiliencia: queuea operaciones de control-plane fallidas para reconciliación', async () => {
  const {
    syncContractToConnector,
    listPendingConnectorOperations
  } = loadConnectorService({
    DATASPACE_CONNECTOR_MODE: 'DSSC_HTTP',
    DSSC_CONNECTOR_BASE_URL: 'http://localhost:9999',
    DSSC_CONNECTOR_RETRY_MAX: 0
  });

  await assert.rejects(
    () =>
      syncContractToConnector({
        id: 10,
        providerId: 3,
        consumerId: 9,
        datasetId: 7,
        status: 'ACTIVE'
      }),
    (error) => ['CONNECTOR_NETWORK_ERROR', 'CONNECTOR_UPSTREAM_ERROR', 'CONNECTOR_TIMEOUT'].includes(error.code)
  );

  const pending = listPendingConnectorOperations();
  assert.ok(pending.length >= 1);
  assert.equal(pending[0].operation, 'control-plane.contract.sync');
});


test('Trust conector: falla cuando mTLS está habilitado sin cert/key configurados', async () => {
  const { requestDataPlaneAccess } = loadConnectorService({
    DATASPACE_CONNECTOR_MODE: 'DSSC_HTTP',
    DSSC_CONNECTOR_BASE_URL: 'https://connector.example',
    DSSC_CONNECTOR_MTLS_ENABLED: 'true',
    DSSC_CONNECTOR_MTLS_CERT_PATH: '',
    DSSC_CONNECTOR_MTLS_KEY_PATH: ''
  });

  await assert.rejects(
    () =>
      requestDataPlaneAccess({
        dataset: { id: 7, storageUri: 'https://example.org/data' },
        contract: { id: 3 },
        consumerId: 9,
        action: 'download'
      }),
    (error) => error.code === 'CONNECTOR_MTLS_CONFIG_INVALID'
  );
});

test('Interoperabilidad adapter: soporta profile DSSC_V1 con endpoint configurable', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/interop/access' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const parsed = JSON.parse(body);
        assert.ok(parsed.accessRequest);
        assert.equal(parsed.accessRequest.action, 'use');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: { accessEndpoint: 'https://provider.example/data', accessToken: 'token-vendor' } }));
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const { requestDataPlaneAccess } = loadConnectorService({
    DATASPACE_CONNECTOR_MODE: 'DSSC_HTTP',
    DSSC_CONNECTOR_BASE_URL: `http://127.0.0.1:${port}`,
    DSSC_CONNECTOR_PROFILE: 'DSSC_V1',
    DSSC_CONNECTOR_ACCESS_PATH: '/interop/access',
    DSSC_CONNECTOR_RETRY_MAX: 0
  });

  const result = await requestDataPlaneAccess({
    dataset: { id: 7, storageUri: 'https://example.org/data' },
    contract: { id: 3 },
    consumerId: 9,
    action: 'use'
  });

  assert.equal(result.endpoint, 'https://provider.example/data');
  assert.equal(result.token, 'token-vendor');

  await new Promise((resolve) => server.close(resolve));
});

test('Interoperabilidad adapter: soporta autenticación con custom header', async () => {
  const server = http.createServer((req, res) => {
    assert.equal(req.headers['x-participant-api-key'], 'key-123');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ endpoint: 'https://provider.example/data' }));
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const { requestDataPlaneAccess } = loadConnectorService({
    DATASPACE_CONNECTOR_MODE: 'DSSC_HTTP',
    DSSC_CONNECTOR_BASE_URL: `http://127.0.0.1:${port}`,
    DSSC_CONNECTOR_API_KEY: 'key-123',
    DSSC_CONNECTOR_AUTH_MODE: 'CUSTOM_HEADER',
    DSSC_CONNECTOR_AUTH_HEADER: 'X-Participant-Api-Key',
    DSSC_CONNECTOR_RETRY_MAX: 0
  });

  const result = await requestDataPlaneAccess({
    dataset: { id: 7, storageUri: 'https://example.org/data' },
    contract: { id: 3 },
    consumerId: 9,
    action: 'read'
  });

  assert.equal(result.endpoint, 'https://provider.example/data');
  await new Promise((resolve) => server.close(resolve));
});
