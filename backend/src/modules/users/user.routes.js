const express = require('express');
const {
  listUsersController,
  updateUserRoleController,
  updateUserStatusController,
  createUserController,
  approveUserController,
  rejectUserController,
  blockUserController,
  unblockUserController,
  deleteUserController,
} = require('./user.controller');

const { requireAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole(['OPERATOR']));

router.get('/', listUsersController);
router.post('/', createUserController);
router.patch('/:id/role', updateUserRoleController);
router.patch('/:id/status', updateUserStatusController);

router.patch('/:id/approve', approveUserController);
router.patch('/:id/reject', rejectUserController);

router.patch('/:id/block', blockUserController);
router.patch('/:id/unblock', unblockUserController);

router.delete('/:id', deleteUserController);

module.exports = router;