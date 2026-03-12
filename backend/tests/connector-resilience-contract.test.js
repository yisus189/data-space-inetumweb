const test = require('node:test');
const assert = require('node:assert/strict');

function loadConnectorService(env = {}) {
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
