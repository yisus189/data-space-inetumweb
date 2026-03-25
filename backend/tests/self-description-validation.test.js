const test = require('node:test');
const assert = require('node:assert/strict');

function loadSelfDescriptionWithMockData(data) {
  const dbPath = require.resolve('../src/config/db');
  delete require.cache[dbPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      dataset: { findMany: async () => data.datasets || [] },
      contract: { findMany: async () => data.contracts || [] },
      user: {
        findMany: async ({ where }) => {
          if (where.role === 'PROVIDER') return data.providers || [];
          return data.consumers || [];
        }
      },
      accessRequest: { findMany: async () => data.accessRequests || [] }
    }
  };

  const servicePath = require.resolve('../src/modules/selfDescription/selfDescription.service');
  delete require.cache[servicePath];
  return require('../src/modules/selfDescription/selfDescription.service');
}

test('self-description: excluye entidades sin campos requeridos y conserva opcionales faltantes', async () => {
  const { buildSelfDescription } = loadSelfDescriptionWithMockData({
    datasets: [
      {
        id: 1,
        name: 'Dataset completo',
        providerId: 100,
        description: null,
        storageUri: null,
        storageType: 'FILE',
        dataClassification: 'INTERNAL',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
        blocked: false,
        category: 'finanzas',
        tags: 'kpi,corporativo',
        provider: { id: 100, name: 'Provider A', email: 'prov@inetum.com', orgUnit: 'Finance' }
      },
      {
        id: 2,
        name: '',
        providerId: 101,
        description: 'incompleto',
        storageUri: 'https://api.example',
        storageType: 'EXTERNAL_API',
        dataClassification: 'INTERNAL',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
        blocked: false,
        category: null,
        tags: null,
        provider: { id: 101, name: 'Provider B', email: 'prov2@inetum.com', orgUnit: 'IT' }
      }
    ],
    contracts: [
      {
        id: 10,
        datasetId: 1,
        consumerId: 200,
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-01-01T00:00:00Z'),
        effectiveTo: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        odrlPolicy: { permission: [] }
      }
    ],
    providers: [
      { id: 100, name: 'Provider A', email: 'prov@inetum.com', orgUnit: 'Finance' }
    ],
    consumers: [
      { id: 200, name: 'Consumer A', email: 'cons@inetum.com', orgUnit: 'Ops' }
    ],
    accessRequests: [
      { id: 500, dataset: { id: 1, name: 'Dataset completo' } }
    ]
  });

  const sd = await buildSelfDescription();

  assert.equal(sd.version, '2.2.0');
  assert.equal(sd.validationPolicy.gate, 'REQUIRED_FIELDS_MANDATORY');
  assert.equal(sd.dataResources.length, 1);
  assert.equal(sd.dataResources[0].publicationId, 1);
  assert.equal(sd.validationPolicy.summary.dataResources.rejected, 1);
  assert.ok(sd.validationPolicy.rejectedEntities.some((r) => r.entityType === 'dataResources' && r.id === 2));
});

test('self-description: helper validateEntityFields reporta faltantes requeridos/opcionales', () => {
  const { validateEntityFields } = loadSelfDescriptionWithMockData({});
  const result = validateEntityFields(
    { publicationId: 1, name: '', providerId: 2, format: 'FILE', createdAt: null, endpoint: null },
    ['publicationId', 'name', 'providerId', 'format', 'createdAt'],
    ['endpoint']
  );

  assert.equal(result.isAccepted, false);
  assert.deepEqual(result.missingRequired.sort(), ['createdAt', 'name']);
  assert.deepEqual(result.missingOptional, ['endpoint']);
});
