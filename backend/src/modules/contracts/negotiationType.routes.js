const express = require('express');
const {
  listNegotiationTypesController,
  createNegotiationTypeController,
  updateNegotiationTypeController,
  deleteNegotiationTypeController
} = require('./negotiationType.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole(['OPERATOR']));

router.get('/', listNegotiationTypesController);
router.post('/', createNegotiationTypeController);
router.patch('/:id', updateNegotiationTypeController);
router.delete('/:id', deleteNegotiationTypeController);

module.exports = router;