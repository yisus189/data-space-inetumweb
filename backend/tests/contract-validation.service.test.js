const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateContractIsCurrentlyUsable
} = require('../src/modules/contracts/contract-validation.service');

const now = new Date('2026-02-01T10:00:00.000Z');

test('acepta contrato activo y vigente', () => {
  assert.doesNotThrow(() => {
    validateContractIsCurrentlyUsable(
      {
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        effectiveTo: new Date('2026-12-01T00:00:00.000Z')
      },
      now
    );
  });
});

test('rechaza contrato revocado', () => {
  assert.throws(() => {
    validateContractIsCurrentlyUsable(
      {
        status: 'REVOKED',
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        effectiveTo: new Date('2026-12-01T00:00:00.000Z')
      },
      now
    );
  });
});

test('rechaza contrato expirado', () => {
  assert.throws(() => {
    validateContractIsCurrentlyUsable(
      {
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        effectiveTo: new Date('2026-01-15T00:00:00.000Z')
      },
      now
    );
  });
});
