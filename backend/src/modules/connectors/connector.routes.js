const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const {
  getConnectorStatusController,
  listPendingConnectorOpsController,
  retryPendingConnectorOpsController
} = require('./connector.controller');

const router = express.Router();

router.get('/status', requireAuth, requireRole(['OPERATOR']), getConnectorStatusController);
router.get('/pending-operations', requireAuth, requireRole(['OPERATOR']), listPendingConnectorOpsController);
router.post('/pending-operations/retry', requireAuth, requireRole(['OPERATOR']), retryPendingConnectorOpsController);

module.exports = router;
