// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient, UserStatus } = require('@prisma/client');
const { generateToken } = require('../auth');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /auth/register
 * Registro de nuevos usuarios (CONSUMER o PROVIDER)
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,     // nombre completo
      country,
      city,
      phone,
      email,
      password,
      role,     // 'PROVIDER' o 'CONSUMER'
    } = req.body;

    if (!['PROVIDER', 'CONSUMER'].includes(role)) {
      return res.status(400).json({ error: 'Rol no permitido' });
    }

    const exists = await prisma.user.findUnique({
      where: { email },          // email: string
    });
    if (exists) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        country,
        city,
        phone,
        email,
        password: hashed,
        role,
        status: UserStatus.PENDING,
      },
    });

    res.json({
      message:
        'Registro creado correctamente. Tu cuenta será revisada por un operador antes de poder acceder.',
      userId: user.id,
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
    // Log de depuración para ver qué llega
    console.log('Body /auth/login:', req.body);

    const emailFromBody = req.body.email;
    const passwordFromBody = req.body.password;

    if (!emailFromBody || !passwordFromBody) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // Aquí NOS ASEGURAMOS de que sea un string simple
    const user = await prisma.user.findUnique({
      where: { email: emailFromBody },
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
            : 'Tu cuenta no está activa. Contacta con soporte.',
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
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Error en /auth/login', err);
    res.status(500).json({ error: 'Error en login' });
  }
});

module.exports = router;