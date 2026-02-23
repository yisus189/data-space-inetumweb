const test = require('node:test');
const assert = require('node:assert/strict');

const sanitizeInput = require('../src/middleware/sanitizeInput');
const { createRateLimit } = require('../src/middleware/rateLimit');

test('sanitizeInput elimina keys peligrosas', () => {
  const req = {
    body: {
      ok: true,
      __proto__: { polluted: true },
      nested: {
        constructor: 'x',
        safe: 1
      }
    },
    query: { prototype: 'x', p: '1' },
    params: { id: '1' }
  };

  sanitizeInput(req, {}, () => {});

  assert.equal(req.body.ok, true);
  assert.equal(req.body.nested.safe, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(req.body, '__proto__'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(req.body.nested, 'constructor'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(req.query, 'prototype'), false);
});

test('rate limit responde 429 al superar max', () => {
  const limiter = createRateLimit({ windowMs: 1000, max: 2, message: 'limitado' });

  const req = { ip: '10.0.0.1', socket: { remoteAddress: '10.0.0.1' } };

  let statusCode = 200;
  let body;
  const res = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    }
  };

  let nextCalls = 0;
  const next = () => {
    nextCalls += 1;
  };

  limiter(req, res, next);
  limiter(req, res, next);
  limiter(req, res, next);

  assert.equal(nextCalls, 2);
  assert.equal(statusCode, 429);
  assert.equal(body.error, 'limitado');
});
