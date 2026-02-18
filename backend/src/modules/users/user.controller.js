// backend/src/modules/users/user.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /users
 * Devuelve usuarios separados:
 * - pending: status = PENDING
 * - existing: status en [ACTIVE, REJECTED, SUSPENDED]
 */
async function listUsersController(req, res, next) {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        country: true,
        city: true,
        phone: true,
        orgUnit: true,
        updatedAt: true,
      },
    });

    const existingUsers = await prisma.user.findMany({
      where: {
        status: { in: ['ACTIVE', 'REJECTED', 'SUSPENDED'] },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        country: true,
        city: true,
        phone: true,
        orgUnit: true,
        updatedAt: true,
      },
    });

    res.json({
      pending: pendingUsers,
      existing: existingUsers,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /users
 * Crear usuario (si lo usas para alta manual).
 * IMPORTANTE: el estado inicial debe ser PENDING.
 */
async function createUserController(req, res, next) {
  try {
    const { email, password, name, role, country, city, phone, orgUnit } =
      req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ error: 'Email, password y role son obligatorios' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password, // aquí debería ir ya hasheado según tu lógica
        name,
        role,
        country,
        city,
        phone,
        orgUnit,
        status: 'PENDING', // recién creado → pendiente de aprobación
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        country: true,
        city: true,
        phone: true,
        orgUnit: true,
        updatedAt: true,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/:id/role
 * Actualizar rol de un usuario
 */
async function updateUserRoleController(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'El rol es obligatorio' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/:id/status
 * Actualizar estado de un usuario (uso genérico)
 */
async function updateUserStatusController(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'El estado es obligatorio' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/:id/approve
 * PENDING -> ACTIVE
 */
async function approveUserController(req, res, next) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/:id/reject
 * PENDING -> REJECTED
 */
async function rejectUserController(req, res, next) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/:id/block
 * Bloquear usuario: → SUSPENDED
 */
async function blockUserController(req, res, next) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' }, // usamos SUSPENDED de tu enum
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/:id/unblock
 * SUSPENDED -> ACTIVE
 */
async function unblockUserController(req, res, next) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /users/:id
 * Eliminar usuario
 */
async function deleteUserController(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (id === req.user.id) {
      return res
        .status(400)
        .json({ error: 'No puedes eliminar tu propio usuario' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsersController,
  createUserController,
  updateUserRoleController,
  updateUserStatusController,
  approveUserController,
  rejectUserController,
  blockUserController,
  unblockUserController,
  deleteUserController,
};