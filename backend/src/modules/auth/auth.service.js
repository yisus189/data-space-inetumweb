const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');
const { generateToken } = require('../../middleware/auth');

async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  if (user.status !== 'ACTIVE') {
    const error = new Error('Usuario deshabilitado');
    error.status = 403;
    throw error;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      orgUnit: user.orgUnit
    }
  };
}

/**
 * Función de seeding simple para crear usuarios iniciales
 * (Provider, Consumer, Operator) si no existen.
 */
async function seedInitialUsers() {
  const usersToEnsure = [
    {
      name: 'Provider Demo',
      email: 'provider@example.com',
      role: 'PROVIDER',
      plainPassword: 'provider123'
    },
    {
      name: 'Consumer Demo',
      email: 'consumer@example.com',
      role: 'CONSUMER',
      plainPassword: 'consumer123'
    },
    {
      name: 'Operator Demo',
      email: 'operator@example.com',
      role: 'OPERATOR',
      plainPassword: 'operator123'
    }
  ];

  for (const u of usersToEnsure) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email }
    });

    if (!existing) {
      const hash = await bcrypt.hash(u.plainPassword, 10);
      await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hash,
          role: u.role
        }
      });
      console.log(`Usuario creado: ${u.email} / ${u.plainPassword} (${u.role})`);
    }
  }
}

module.exports = {
  login,
  seedInitialUsers
};