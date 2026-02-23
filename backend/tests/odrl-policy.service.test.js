const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateOdrlPolicy } = require('../src/modules/exchange/odrl-policy.service');

const now = new Date('2026-02-01T10:00:00.000Z');

const baseContext = {
  action: 'download',
  purpose: 'analytics',
  now,
  assignee: 'urn:dataspace:user:9',
  assigner: 'urn:dataspace:user:3',
  target: 'urn:dataspace:dataset:7'
};

test('permite acceso cuando no hay política', () => {
  const result = evaluateOdrlPolicy(null, baseContext);
  assert.equal(result.allow, true);
  assert.equal(result.matchedRuleType, 'NONE');
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

  const result = evaluateOdrlPolicy(policy, baseContext);
  assert.equal(result.allow, true);
  assert.equal(result.matchedRuleType, 'PERMISSION');
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

  const result = evaluateOdrlPolicy(policy, baseContext);
  assert.equal(result.allow, false);
  assert.equal(result.matchedRuleType, 'NO_PERMISSION_MATCH');
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

  const result = evaluateOdrlPolicy(policy, baseContext);
  assert.equal(result.allow, false);
  assert.equal(result.matchedRuleType, 'PROHIBITION');
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

  const result = evaluateOdrlPolicy(policy, baseContext);
  assert.equal(result.allow, true);
});

test('soporta restricciones por assignee y target', () => {
  const policy = {
    permission: [
      {
        action: [{ '@id': 'download' }],
        constraint: [
          {
            leftOperand: 'assignee',
            operator: 'eq',
            rightOperand: 'urn:dataspace:user:9'
          },
          {
            leftOperand: 'target',
            operator: 'eq',
            rightOperand: 'urn:dataspace:dataset:7'
          }
        ]
      }
    ]
  };

  const result = evaluateOdrlPolicy(policy, baseContext);
  assert.equal(result.allow, true);
});

test('operator neq en assignee deniega cuando coincide', () => {
  const policy = {
    permission: [
      {
        action: 'download',
        constraint: [
          {
            leftOperand: 'assignee',
            operator: 'neq',
            rightOperand: 'urn:dataspace:user:9'
          }
        ]
      }
    ]
  };

  const result = evaluateOdrlPolicy(policy, baseContext);
  assert.equal(result.allow, false);
});

test('operator isAnyOf permite purpose de catálogo', () => {
  const policy = {
    permission: [
      {
        action: 'download',
        constraint: [
          {
            leftOperand: 'purpose',
            operator: 'isAnyOf',
            rightOperand: ['research', 'analytics']
          }
        ]
      }
    ]
  };

  const result = evaluateOdrlPolicy(policy, baseContext);
  assert.equal(result.allow, true);
});
