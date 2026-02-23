const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function sanitizeObject(value) {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, val] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }
    clean[key] = sanitizeObject(val);
  }

  return clean;
}

function sanitizeInput(req, res, next) {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
}

module.exports = sanitizeInput;
