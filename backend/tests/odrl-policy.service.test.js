const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateOdrlPolicy } = require('../src/modules/exchange/odrl-policy.service');

const now = new Date('2026-02-01T10:00:00.000Z');

test('permite acceso cuando no hay política', () => {
  const result = evaluateOdrlPolicy(null, {
    action: 'download',
    purpose: 'analytics',
    now
  });

  assert.equal(result.allow, true);
});

test('permite acción autorizada con constraint de purpose', () => {
  const policy = {
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
  };

  const result = evaluateOdrlPolicy(policy, {
    action: 'download',
    purpose: 'analytics',
    now
  });

  assert.equal(result.allow, true);
});

test('deniega acción cuando no coincide el purpose', () => {
  const policy = {
    permission: [
      {
        action: 'download',
        constraint: [
          {
            leftOperand: 'purpose',
            operator: 'eq',
            rightOperand: 'risk'
          }
        ]
      }
    ]
  };

  const result = evaluateOdrlPolicy(policy, {
    action: 'download',
    purpose: 'analytics',
    now
  });

  assert.equal(result.allow, false);
});

test('deniega por prohibición explícita', () => {
  const policy = {
    permission: [
      {
        action: 'download'
      }
    ],
    prohibition: [
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
  };

  const result = evaluateOdrlPolicy(policy, {
    action: 'download',
    purpose: 'analytics',
    now
  });

  assert.equal(result.allow, false);
});

test('permite por ventana temporal lteq', () => {
  const policy = {
    permission: [
      {
        action: 'download',
        constraint: [
          {
            leftOperand: 'dateTime',
            operator: 'lteq',
            rightOperand: '2026-12-31T00:00:00.000Z'
          }
        ]
      }
    ]
  };

  const result = evaluateOdrlPolicy(policy, {
    action: 'download',
    purpose: 'analytics',
    now
  });

  assert.equal(result.allow, true);
});
