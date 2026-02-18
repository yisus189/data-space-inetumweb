const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');

async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      orgUnit: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

async function updateUserRole(userId, role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role }
  });
}

async function updateUserStatus(userId, status) {
  return prisma.user.update({
    where: { id: userId },
    data: { status }
  });
}

async function createUser({ name, email, password, role, orgUnit }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Ya existe un usuario con ese email');
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role: role || 'CONSUMER',
      orgUnit
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      orgUnit: true
    }
  });
}

module.exports = {
  listUsers,
  updateUserRole,
  updateUserStatus,
  createUser
};