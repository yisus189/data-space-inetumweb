const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'cambia-este-secreto';
const JWT_ISSUER = process.env.JWT_ISSUER || 'inetum-dataspace';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'inetum-dataspace-api';
const ALLOW_QUERY_TOKEN = process.env.ALLOW_QUERY_TOKEN === 'true';

const JWT_KID = process.env.JWT_KID || 'default-hs256';
const JWT_ALGORITHM = (process.env.JWT_ALGORITHM || 'HS256').toUpperCase();
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || null;
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || null;

function getJwtSignConfig() {
  if (JWT_ALGORITHM === 'RS256' && JWT_PRIVATE_KEY) {
    return {
      algorithm: 'RS256',
      key: JWT_PRIVATE_KEY,
      kid: JWT_KID
    };
  }

  return {
    algorithm: 'HS256',
    key: JWT_SECRET,
    kid: JWT_KID
  };
}

function getJwtVerifyKey(decodedHeader = {}) {
  if (JWT_ALGORITHM === 'RS256' && JWT_PUBLIC_KEY) {
    return JWT_PUBLIC_KEY;
  }

  if (decodedHeader.alg === 'HS256' || !decodedHeader.alg) {
    return JWT_SECRET;
  }

  return JWT_SECRET;
}

function generateToken(user) {
  const signConfig = getJwtSignConfig();

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    signConfig.key,
    {
      expiresIn: '8h',
      algorithm: signConfig.algorithm,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      header: {
        kid: signConfig.kid
      }
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
    const decodedHeader = jwt.decode(token, { complete: true })?.header || {};
    const verifyKey = getJwtVerifyKey(decodedHeader);
    const acceptedAlgorithms = JWT_ALGORITHM === 'RS256' ? ['RS256'] : ['HS256'];

    const payload = jwt.verify(token, verifyKey, {
      algorithms: acceptedAlgorithms,
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

function getJwks() {
  if (JWT_ALGORITHM !== 'RS256' || !JWT_PUBLIC_KEY) {
    return { keys: [] };
  }

  try {
    const publicKey = crypto.createPublicKey(JWT_PUBLIC_KEY);
    const jwk = publicKey.export({ format: 'jwk' });

    return {
      keys: [
        {
          ...jwk,
          use: 'sig',
          kid: JWT_KID,
          alg: 'RS256'
        }
      ]
    };
  } catch (error) {
    return { keys: [] };
  }
}

module.exports = {
  generateToken,
  requireAuth,
  requireRole,
  getJwks,
  getJwtSignConfig
};
