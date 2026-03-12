// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const { UserStatus } = require('@prisma/client');
const prisma = require('../config/db');
const { generateToken, getJwks, getJwtSignConfig } = require('../middleware/auth');

const router = express.Router();

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function validatePasswordStrength(password) {
  if (typeof password !== 'string') return false;
  // mínimo corporativo básico
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}


router.get('/.well-known/jwks.json', (req, res) => {
  const jwks = getJwks();
  res.json(jwks);
});

router.get('/token-metadata', (req, res) => {
  const config = getJwtSignConfig();
  res.json({
    issuer: process.env.JWT_ISSUER || 'inetum-dataspace',
    audience: process.env.JWT_AUDIENCE || 'inetum-dataspace-api',
    algorithm: config.algorithm,
    kid: config.kid
  });
});

/**
 * POST /auth/register
 * Registro de nuevos usuarios (CONSUMER o PROVIDER)
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      country,
      city,
      phone,
      email,
      password,
      role
    } = req.body;

    if (!['PROVIDER', 'CONSUMER'].includes(role)) {
      return res.status(400).json({ error: 'Rol no permitido' });
    }

    if (typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ error: 'Nombre inválido' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        error:
          'La contraseña debe tener mínimo 12 caracteres, mayúsculas, minúsculas, número y símbolo'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (exists) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        country: country || null,
        city: city || null,
        phone: phone || null,
        email: normalizedEmail,
        password: hashed,
        role,
        status: UserStatus.PENDING
      }
    });

    res.json({
      message:
        'Registro creado correctamente. Tu cuenta será revisada por un operador antes de poder acceder.',
      userId: user.id
    });
  } catch (err) {
    console.error('Error en /auth/register', err);
    res.status(500).json({ error: 'Error en el registro' });
  }
});

/**
 * POST /auth/login
 * Login con verificación de estado
 */
router.post('/login', async (req, res) => {
  try {
    const emailFromBody = req.body.email;
    const passwordFromBody = req.body.password;

    if (!validateEmail(emailFromBody) || typeof passwordFromBody !== 'string') {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios y válidos' });
    }

    const normalizedEmail = emailFromBody.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(passwordFromBody, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({
        error:
          user.status === UserStatus.PENDING
            ? 'Tu cuenta aún no ha sido aprobada por un operador.'
            : 'Tu cuenta no está activa. Contacta con soporte.'
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        country: user.country,
        city: user.city,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Error en /auth/login', err);
    res.status(500).json({ error: 'Error en login' });
  }
});

module.exports = router;
