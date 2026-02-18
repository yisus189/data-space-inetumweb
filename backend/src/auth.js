const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'cambia-este-secreto';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : null;

  const tokenFromQuery = req.query.token;
  const token = tokenFromHeader || tokenFromQuery;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireProvider(req, res, next) {
  return requireRole(['PROVIDER'])(req, res, next);
}

module.exports = {
  generateToken,
  requireAuth,
  requireRole,
  requireOperator,
  requireProvider,
};

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

function requireOperator(req, res, next) {
  return requireRole(['OPERATOR'])(req, res, next);
}

function requireProvider(req, res, next) {
  return requireRole(['PROVIDER'])(req, res, next);
}

module.exports = {
  generateToken,
  requireAuth,
  requireRole,
  requireOperator,
  requireProvider, // <-- asegúrate de exportarlo
};