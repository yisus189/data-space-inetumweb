const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'cambia-este-secreto';
const JWT_ISSUER = process.env.JWT_ISSUER || 'inetum-dataspace';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'inetum-dataspace-api';
const ALLOW_QUERY_TOKEN = process.env.ALLOW_QUERY_TOKEN === 'true';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: '8h',
      algorithm: 'HS256',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  );
}

function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '').trim()
    : null;

  if (tokenFromHeader) {
    return tokenFromHeader;
  }

  if (ALLOW_QUERY_TOKEN && req.query.token) {
    return String(req.query.token);
  }

  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

module.exports = {
  generateToken,
  requireAuth,
  requireRole
};
