const test = require('node:test');
const assert = require('node:assert/strict');

function loadExchangeWithPrismaMock(prismaMock) {
  const dbModulePath = require.resolve('../src/config/db');
  const servicePath = require.resolve('../src/modules/exchange/exchange.service');

  delete require.cache[servicePath];
  require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: prismaMock
  };

  return require('../src/modules/exchange/exchange.service');
}

function buildBasePrismaMock() {
  return {
    dataset: {
      findUnique: async () => ({
        id: 7,
        name: 'Dataset seguro',
        status: 'ACTIVE',
        blocked: false,
        published: true,
        storageType: 'EXTERNAL_API',
        storageUri: 'https://example.org/api/data'
      })
    },
    contract: {
      findFirst: async () => ({
        id: 10,
        consumerId: 9,
        providerId: 3,
        datasetId: 7,
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        effectiveTo: new Date('2026-12-31T00:00:00.000Z'),
        accessRequest: {
          requestedPurpose: 'analytics'
        },
        odrlPolicy: {
          permission: [{ action: 'use' }]
        }
      })
    },
    accessLog: {
      create: async ({ data }) => ({ id: 1, ...data })
    }
  };
}

test('Fase 1: deniega acceso cuando no existe contrato usable', async () => {
  const prismaMock = buildBasePrismaMock();
  prismaMock.contract.findFirst = async () => null;

  const { prepareDatasetAccess } = loadExchangeWithPrismaMock(prismaMock);

  await assert.rejects(
    () =>
      prepareDatasetAccess(
        { id: 9, role: 'CONSUMER' },
        7,
        { ipAddress: '127.0.0.1', userAgent: 'test' }
      ),
    (error) => error.status === 403 && /No existe contrato/.test(error.message)
  );
});

test('Fase 1: deniega acceso cuando dataset está bloqueado/no activo', async () => {
  const prismaMock = buildBasePrismaMock();
  prismaMock.dataset.findUnique = async () => ({
    id: 7,
    status: 'ACTIVE',
    blocked: true,
    published: true,
    storageType: 'EXTERNAL_API',
    storageUri: 'https://example.org/api/data'
  });

  const { prepareDatasetAccess } = loadExchangeWithPrismaMock(prismaMock);

  await assert.rejects(
    () =>
      prepareDatasetAccess(
        { id: 9, role: 'CONSUMER' },
        7,
        { ipAddress: '127.0.0.1', userAgent: 'test' }
      ),
    (error) => error.status === 403 && /Dataset no disponible/.test(error.message)
  );
});

test('Fase 2 avanzada: registra POLICY_DENY cuando ODRL deniega', async () => {
  const prismaMock = buildBasePrismaMock();
  let capturedAction;
  let capturedExtra;

  prismaMock.contract.findFirst = async () => ({
    id: 10,
    consumerId: 9,
    providerId: 3,
    datasetId: 7,
    status: 'ACTIVE',
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    effectiveTo: new Date('2026-12-31T00:00:00.000Z'),
    accessRequest: {
      requestedPurpose: 'analytics'
    },
    odrlPolicy: {
      permission: [
        {
          action: 'download',
          constraint: [
            {
              leftOperand: 'purpose',
              operator: 'eq',
              rightOperand: 'analytics'
            }
          ]
        }
      ]
    }
  });

  prismaMock.accessLog.create = async ({ data }) => {
    capturedAction = data.action;
    capturedExtra = data.extra;
    return { id: 99, ...data };
  };

  const { prepareDatasetAccess } = loadExchangeWithPrismaMock(prismaMock);

  await assert.rejects(
    () =>
      prepareDatasetAccess(
        { id: 9, role: 'CONSUMER' },
        7,
        { ipAddress: '127.0.0.1', userAgent: 'test' },
        { action: 'download', purpose: 'fraud-detection' }
      ),
    (error) => error.status === 403 && /no concede permiso/i.test(error.message)
  );

  assert.equal(capturedAction, 'POLICY_DENY');
  assert.match(capturedExtra, /"policyDecision":"DENY"/);
  assert.match(capturedExtra, /"matchedRuleType":"NO_PERMISSION_MATCH"/);
});
