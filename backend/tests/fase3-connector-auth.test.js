const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

function loadConnectorServiceWithMode(mode) {
  process.env.DATASPACE_CONNECTOR_MODE = mode;

  const servicePath = require.resolve('../src/modules/connectors/dssc-connector.service');
  delete require.cache[servicePath];

  return require('../src/modules/connectors/dssc-connector.service');
}

function loadAuthWithEnv(env = {}) {
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  const authPath = require.resolve('../src/middleware/auth');
  delete require.cache[authPath];

  return require('../src/middleware/auth');
}

test('Fase 3: conector local devuelve acceso directo de data plane', async () => {
  const { requestDataPlaneAccess } = loadConnectorServiceWithMode('LOCAL_ENFORCEMENT');

  const result = await requestDataPlaneAccess({
    dataset: { id: 7, storageUri: 'https://example.org/data' },
    contract: { id: 10 },
    consumerId: 9,
    purpose: 'analytics',
    action: 'use'
  });

  assert.equal(result.mode, 'LOCAL_ENFORCEMENT');
  assert.equal(result.transport, 'DIRECT');
  assert.equal(result.endpoint, 'https://example.org/data');
});

test('Fase 3: estado de conector local es saludable', async () => {
  const { getConnectorStatus } = loadConnectorServiceWithMode('LOCAL_ENFORCEMENT');
  const status = await getConnectorStatus();

  assert.equal(status.healthy, true);
  assert.equal(status.mode, 'LOCAL_ENFORCEMENT');
});

test('Fase 3: auth publica JWKS cuando JWT_ALGORITHM=RS256', () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048
  });

  const publicPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();
  const privatePem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();

  const { getJwks, generateToken } = loadAuthWithEnv({
    JWT_ALGORITHM: 'RS256',
    JWT_PUBLIC_KEY: publicPem,
    JWT_PRIVATE_KEY: privatePem,
    JWT_KID: 'phase3-test-key'
  });

  const token = generateToken({ id: 1, email: 'user@example.com', role: 'CONSUMER' });
  const jwks = getJwks();

  assert.equal(typeof token, 'string');
  assert.ok(token.split('.').length === 3);
  assert.ok(Array.isArray(jwks.keys));
  assert.equal(jwks.keys[0].kid, 'phase3-test-key');
  assert.equal(jwks.keys[0].alg, 'RS256');
});
